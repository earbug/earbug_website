# CLAUDE.md

Guidance for Claude Code (and any other AI agent) working in this repository.

## Project overview

EarBug's marketing/profile website. It is a **plain static HTML/CSS/JS site** —
no framework, no build tool, no bundler, no package manager. Pages are hand-written
`.html` files that share duplicated header/footer markup (there is no templating
engine), a single global stylesheet, and a few vanilla-JS files.

### Structure

```
index.html                # Homepage
css/styles.css            # Single global stylesheet (CSS custom properties / design tokens)
js/
  main.js                 # Nav, modal, scroll-reveal, waitlist "notify me" forms (every page)
  blog.js                 # Blog list page — fetches posts from Sanity CMS
  blog-post.js            # Single blog post — fetches + renders Portable Text (ES module)
pages/
  mission.html, blog.html, blog-post.html
  features/  (jukebox, playlist, article, merch)
  platforms/ (apple-music, youtube-music, spotify)
  corporate/ (team, contact, privacy, terms, cookies, gdpr)
assets/                   # favicons, logo, social icons, images, team photos, hero videos
issue-screenshots/        # ad-hoc QA/design reference images — NOT part of the deployed site
amplify.yml               # AWS Amplify Hosting build spec (no build step, just artifact selection)
```

### Notable external integrations

- **Sanity.io** headless CMS backs the blog (`js/blog.js`, `js/blog-post.js`), queried
  client-side via GROQ against `udb0lqxn.apicdn.sanity.io`.
- **`@portabletext/to-html`** is loaded live from the `esm.sh` CDN to render blog post
  rich text — there is no local `node_modules`.
- **AWS Lambda Function URL** (`*.lambda-url.us-east-2.on.aws`) receives "notify me"
  waitlist signups for platforms that haven't launched yet (YouTube Music, Spotify).
- Apple Music already has real store badges wired up in the "Get the App" modal.

### Conventions

- No templating: when adding a new page, copy the header/footer from an existing
  page at the same directory depth and fix up relative paths (`../` vs `../../`).
- Styling uses CSS variables defined at the top of `css/styles.css` (colors, spacing,
  radius, transitions) — reuse tokens rather than hardcoding values.
- JS is plain ES5/ES6, no framework, no bundler — keep new scripts dependency-free
  or load libraries from a CDN the way `blog-post.js` does.
- `css/styles.css` is cache-busted via a `?v=N` query string on the `<link>` tag —
  bump the version when making a change that must bypass browser cache.

## Git branch model & deployment (AWS Amplify Hosting)

This site deploys via **AWS Amplify Hosting**, connected directly to this GitHub
repo. Amplify auto-builds and deploys on every push to a connected branch — there
is no GitHub Actions workflow and no tag-based gating.

| Branch | Amplify environment | Effect of pushing |
|---|---|---|
| `dev`  | dev  | Auto-deploys to the **dev** environment |
| `main` | prod | Auto-deploys to **PRODUCTION** — changes go live on the real site immediately |

### Workflow

1. Do work on a feature branch (or directly on `dev` for small changes).
2. Use the **`git-commit-push`** skill to stage, commit, and push. It warns before
   pushing to `dev` (auto dev-deploy) and warns *loudly* before pushing to `main`
   (auto **prod** deploy).
3. When `dev` has been verified and is ready to go live, use the **`git-release`**
   skill (invoke explicitly with `/git-release`) to merge `dev` into `main` and push.
   This is the only sanctioned path to production — it runs pre-flight checks
   (clean tree, `dev` up to date with `origin/dev`) and requires explicit confirmation
   before pushing `main`.

### Rules

- Never force-push `main`.
- Never push directly to `main` outside the `git-release` skill's merge flow, except
  in a deliberate, explicitly-confirmed hotfix.
- Never commit secrets, API keys, or `.env` files (see `.gitignore`).
- Treat every push to `main` as an irreversible production deploy — Amplify starts
  building immediately.

## One-time AWS Amplify setup (manual, console)

No Amplify app exists yet. To wire up hosting:

1. Sign in to the AWS Console using the **`earbug-prod`** AWS profile/account
   (`639935287145`), region **`us-east-1`**.
2. Open **AWS Amplify → Hosting → Create app → Host web app**.
3. Choose **GitHub** as the source provider and authorize AWS Amplify's GitHub App
   for the `earbug/earbug_website` repository (one-time OAuth flow).
4. Name the app **`earbug-website`**.
5. Add branch **`dev`** first — Amplify will detect `amplify.yml` at the repo root
   automatically for the build spec. Leave auto-build **enabled**.
6. Add branch **`main`** the same way. Leave auto-build **enabled** (pushing `main`
   is meant to deploy prod immediately, per the workflow above).
7. Verify each branch's deployed URL, and optionally attach custom domains
   (e.g. a `dev.` subdomain for the `dev` branch, and the apex/`www` domain for `main`).
8. Confirm a test push to `dev` triggers a build in the Amplify console before
   relying on it.

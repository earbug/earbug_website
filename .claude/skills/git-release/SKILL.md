---
name: git-release
description: Merge dev into main and push, promoting verified changes to production. Triggers an immediate AWS Amplify production deploy. Use only when explicitly invoked with /git-release — never trigger this automatically.
disable-model-invocation: true
---

## Context

`main` is connected to AWS Amplify Hosting's **production** environment. The
moment `main` is pushed, Amplify starts building and deploying the live site.
There is no tag-based gate and no CI approval step — this skill IS the release
gate. Follow every step; do not skip the confirmation.

## Instructions

1. **Check for a clean working tree.** Run `git status --porcelain`. If it's
   not empty, stop and tell the user to commit or stash their changes first
   (point them at the `git-commit-push` skill).

2. **Fetch and verify `dev` is up to date.**
   - `git fetch origin`
   - Compare local `dev` with `origin/dev` (`git rev-list --left-right --count dev...origin/dev`).
   - If local `dev` is behind `origin/dev`, pull first. If local `dev` has
     unpushed commits, push them first (via the normal push flow) before
     releasing, so production matches what's reviewable on GitHub.

3. **Switch to `main` and update it.**
   - `git checkout main`
   - `git pull origin main`

4. **Show what's about to ship.** Run `git log main..dev --oneline` and
   `git diff main..dev --stat`. Present this summary to the user so they know
   exactly what will go to production.

5. **Merge `dev` into `main`.**
   - `git merge dev` (prefer a fast-forward or a plain merge commit; do not
     rebase or squash history that's already on `dev`).
   - If there are conflicts, stop and help the user resolve them manually —
     do not force a resolution without their input.

6. **Show the loud confirmation prompt before pushing:**

   > 🚨 **PRODUCTION RELEASE:** Pushing `main` now will trigger an AWS Amplify
   > production build and deploy the live EarBug site immediately. This cannot
   > be easily undone. Proceed?

   Wait for explicit confirmation. Do not push without it.

7. **Push.** `git push origin main`.

8. **Report the result.** Tell the user the push succeeded and that Amplify's
   production build for `main` should now be running — they can confirm in the
   Amplify console for the `earbug-website` app (branch: `main`, region
   `us-east-1`, account `earbug-prod` / `639935287145`).

## Rules

- Never run this skill automatically — it must be explicitly invoked
  (`/git-release`).
- Never force-push `main`.
- Never skip the pre-flight checks or the confirmation prompt.
- If `dev` and `main` have diverged in a way that isn't a clean merge (e.g.
  someone pushed a hotfix directly to `main`), stop and surface that to the
  user instead of guessing how to reconcile it.

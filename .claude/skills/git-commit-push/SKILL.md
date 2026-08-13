---
name: git-commit-push
description: Stage, commit, and push changes to the current git branch in this repo. Use when the user asks to commit changes, save work, or push to a branch. Warns before pushing to dev (triggers an AWS Amplify dev deploy) and warns loudly before pushing to main (triggers an immediate AWS Amplify PRODUCTION deploy).
argument-hint: [commit message]
---

## Context

This repo deploys via AWS Amplify Hosting, connected directly to two branches:

- `dev` → auto-deploys to the **dev** environment on every push.
- `main` → auto-deploys to **PRODUCTION** on every push (changes go live immediately).

There is no CI pipeline in this repo — Amplify triggers the build itself the
moment a push lands on either branch. See `CLAUDE.md` for the full workflow.

## Instructions

1. Run `git status` and `git diff` (and `git diff --staged` if anything is
   already staged) to see exactly what changed. Summarize it briefly.

2. Determine the current branch with `git branch --show-current`.

3. **Stage only the relevant files** for this change (`git add <files>`), not
   a blind `git add -A`, unless the user clearly wants everything staged.

4. **Branch-specific warning — show this before committing/pushing:**

   - If the branch is `dev`:
     > ⚠️ Pushing to `dev` will trigger an automatic **dev** deployment via AWS Amplify.

   - If the branch is `main`:
     > 🚨 **WARNING:** `main` is the production branch. Pushing to `main` triggers
     > an **immediate PRODUCTION deployment** on AWS Amplify — changes go live on
     > the real site right away. Normal releases should go through the
     > `git-release` skill (merges `dev` → `main` deliberately) instead of pushing
     > to `main` directly. Only proceed here if this is an intentional, reviewed
     > change (e.g. a hotfix).

   In either case, ask the user to confirm before continuing. This is a
   warn-but-allow policy — don't refuse outright, but never skip the warning
   and never assume confirmation silently.

   - If the branch is anything else (a feature branch), no special warning is
     needed since Amplify isn't watching it.

5. Write a concise commit message. Use the message passed via `$ARGUMENTS` if
   provided; otherwise infer a short, conventional-commit-style message from
   the diff (e.g. `fix: correct nav dropdown z-index`).

6. Commit: `git commit -m "<message>"`.

7. Push:
   - If the branch already has an upstream: `git push`.
   - If not: `git push -u origin <branch>`.

8. After a push to `dev` or `main`, remind the user which Amplify environment
   is now (re)building.

## Rules

- Never force-push (`--force` / `-f`) to any shared branch, especially `main`
  or `dev`.
- Never amend or rewrite history that has already been pushed.
- Never commit `.env` files, credentials, or other secrets — check the diff
  for anything that looks like a key/token before committing.
- Never silently push to `main` without showing the loud warning above.

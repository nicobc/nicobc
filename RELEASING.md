# Releasing

Production deploys are triggered by pushing a CalVer tag. The tag is the deploy decision — always manual. A release typically includes multiple PRs.

Commit convention follows `.claude/board/rules.md`.

## PR scope

One ticket = one PR. Include more only when tickets are directly dependent (e.g. a chore that unblocks the feat in the same PR). Keep PRs lean — a focused PR is easier to review and revert.

Keep the PR description current: update the summary when new commits change the scope, and tick test plan items as CI validates them.

## Branching

Work on short-lived feature branches cut directly from `main`. Branch name mirrors the commit type and scope: `type/scope` (e.g. `feat/bcn-map`, `ci/deployment`, `fix/app`). Delete the branch after the PR merges.

Each branch gets its own Cloudflare Pages preview deployment.

## Process

1. Cut a branch from main:
   ```bash
   git fetch origin
   git switch -c type/scope origin/main
   ```
2. Commit following conventional commits.
3. `git push origin type/scope`
4. `gh pr create --base main --head type/scope --repo nicobc/nicobc`
5. Watch CI: `gh run watch <run-id> --repo nicobc/nicobc`
   - CI failure → fix and return to step 2. Never merge a failing PR.
6. Update the board ticket to DONE and commit the change before merging.
7. Get explicit approval before merging. PR title must follow conventional commits — it becomes the squash commit message on main.
   `gh pr merge <n> --squash --delete-branch --repo nicobc/nicobc`
8. Clean up local branch:
   ```bash
   git switch main
   git pull origin main
   git branch -D type/scope
   ```
   `-D` required — squash merges leave the local branch unrecognised as merged by git.
9. _(Only if changes require redeploying `app/`)_ Create and push a CalVer tag from main:
   ```bash
   git fetch origin main
   git tag vYYYY.MM.N origin/main
   git push origin vYYYY.MM.N
   ```
   Increment the patch number within the month (e.g. `v2026.05.6` follows `v2026.05.5`).
   Watch deploy: `gh run watch <run-id> --repo nicobc/nicobc`. Report success or failure.

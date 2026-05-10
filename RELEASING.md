# Releasing

Production deploys are triggered by pushing a CalVer tag. The tag is the deploy decision — always manual. A release typically includes multiple PRs.

Commit convention follows `.claude/board/rules.md`.

## PR scope

One ticket = one PR. Include more only when tickets are directly dependent (e.g. a chore that unblocks the feat in the same PR). Keep PRs lean — a focused PR is easier to review and revert.

## Process

1. Commit to `dev` following conventional commits.
2. `git push origin dev`
3. `gh pr create --base main --head dev --repo nicobc/nicobc`
4. Watch CI: `gh run watch <run-id> --repo nicobc/nicobc`
   - CI failure → fix and return to step 1. Never merge a failing PR.
5. Get explicit approval before merging.
   `gh pr merge <n> --rebase --repo nicobc/nicobc`
6. Create and push a CalVer tag from main:
   ```bash
   git fetch origin main
   git tag vYYYY.MM.N origin/main
   git push origin vYYYY.MM.N
   ```
   Increment the patch number within the month (e.g. `v2026.05.6` follows `v2026.05.5`).
7. Watch deploy: `gh run watch <run-id> --repo nicobc/nicobc`. Report success or failure.

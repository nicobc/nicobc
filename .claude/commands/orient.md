Read the board and recent git history, then output a session briefing.

1. Read `.claude/board/index.yaml`
2. Read epic files for all IN PROGRESS and READY epics
3. Read `.claude/board/maintenance.yaml` if maintenance section in index is non-empty
4. Run `git log --oneline -10`

Output:
**Active** — IN PROGRESS epics and next actionable feat ticket
**Up next** — READY feat tickets across epics, priority order
**Maintenance** — open tickets from maintenance.yaml and any open non-feat tickets in feature epics
**Needs grooming** — IDEATION epics blocking progress
**Recent commits** — last 5, one line each

Tight. No flourish.

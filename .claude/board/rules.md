# board rules

## terminology
ticket: generic term for any item in an epic or in maintenance.yaml
story: alias for a `feat`-type ticket; "As a X, I want Y" format applies to stories only; other types have no prescribed format

## ticket numbering
Tickets are numbered per-epic or per-file: T1, T2, …
Referenced externally as `EPIC-XXX / TN` for epic tickets, `MAINT / TN` for maintenance tickets.

## ticket type
All tickets have a `type` field. Valid values mirror the conventional commits specification:
`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `chore`, `build`, `revert`

## epic scope
All epics have a `scope` field: short human-readable name used in commit messages (e.g. `data-contracts`, `bcn-map`).
Maintenance tickets have their own `scope` field for the same purpose.

## ticket statuses
Valid values: IDEATION, READY, IN PROGRESS, DONE, DISCARDED.

DISCARDED tickets stay in their file. Do not delete or renumber.

## epic status
- READY: all tickets READY, none started
- IN PROGRESS: any ticket is IN PROGRESS or DONE, but not all tickets are DONE or DISCARDED
- DONE: all tickets DONE or DISCARDED; final and cannot be reopened

New work discovered after an epic is DONE goes to a new epic or the maintenance backlog — do not reopen.

Before marking a ticket DONE, groom any now-unblocked IDEATION tickets to READY.

## maintenance tickets
Cross-cutting non-`feat` work that doesn't belong to a specific epic lives in `maintenance.yaml`.
Non-`feat` tickets that do belong to a specific epic (e.g. a bug in a feature area) live in that epic's `tickets:` list.

## commit convention
One ticket = one commit. Before committing, update the ticket status to DONE in the board — this is a non-optional acceptance criterion, not a follow-up. The commit includes both the code changes and the board update.

Commit message: `type(scope): description`
`type` and `scope` are taken directly from the ticket. Epic tickets inherit scope from the parent epic; maintenance tickets have their own `scope` field.

Include a `Closes EPIC-XXX/TN` footer (or `Closes MAINT/TN`) for traceability. Place it after `Co-Authored-By` if present.

Exception: board meta-work (structural changes to the board itself, convention updates) uses `chore(board): ...` with no ticket required. `board` is a reserved scope.

## grooming convention
Each grooming session (moving an epic from IDEATION to READY) is committed separately per epic as `chore(board): groom EPIC-XXX`. No ticket required. The commit includes the epic file and any index.yaml changes for that epic only.

## maintenance index section
Open tickets from `maintenance.yaml` plus any open non-`feat` tickets from feature epics appear in the `maintenance:` section of `index.yaml`. Load individual files only when you need ticket detail.

## yaml integrity
Edit field values only. Never add or remove keys from epic or ticket entries.
Intentional schema changes (e.g. adding a new field to all epics) are exceptions and require an explicit decision.

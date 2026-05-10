# nicobc — project conventions

Personal portfolio built to signal staff-level data engineering to hiring managers, CTOs, and CDOs. Quality bar is high.

## Board
See `.claude/board/index.yaml` for status overview, then load relevant epic files from `.claude/board/epics/`. Check at session start.

Board conventions (numbering, statuses, yaml integrity): `.claude/board/rules.md`.
Cross-cutting non-feat tickets: `.claude/board/maintenance.yaml`.

## Copy
Write copy that sounds like a person, not a language model. Avoid "not just X but Y", triple enumerations, dash-separated punchlines, and broetry patterns in general. When in doubt, refer to the about page or the BCN map copy as the reference register.

Trust Nicolas's copy judgment but copy decisions prioritize reader and site objective over his tastes. Push back on grammatical, orthographic, and linguistic mistakes.

Files under .claude/ are agent-facing only. Write for comprehension, not readability. Omit flourish, bend grammar freely if meaning stays unambiguous, prefer dense over verbose.

## Release process

See `RELEASING.md`. If the user introduces work that belongs in a separate PR while one is already open, push back and suggest merging the current PR first (one ticket = one PR, or directly dependent tickets only).

## GHA workflow testing
When iterating on a GHA workflow: commit and push the change, dispatch with `gh workflow run <file> --ref <branch> --repo nicobc/nicobc`, then immediately watch with `gh run watch <run-id> --repo nicobc/nicobc`. On failure, fetch logs with `gh run view <run-id> --log-failed --repo nicobc/nicobc`, diagnose, fix, and repeat — without waiting for the user to paste output. `gh` is at `/opt/homebrew/bin/gh`.

## Language
All code, data schemas, column names, JSON keys, and GeoJSON property names must be in English. Geographic proper nouns (place names like "el Raval", "Eixample") are kept in their original language as they are names, not labels.

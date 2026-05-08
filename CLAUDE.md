# nicobc — project conventions

Personal portfolio built to signal staff-level data engineering to hiring managers, CTOs, and CDOs. Quality bar is high.

## Board
See `.claude/board/index.md` for status overview, then load relevant epic files from `.claude/board/epics/`. Check at session start.

When implementing an epic, work stories in order. If the next story is IDEATION, stop and groom it to READY before building. Do not skip grooming to build in one go.

When amending board YAML files, edit field values only. Do not remove keys.

## Copy
Write copy that sounds like a person, not a language model. Avoid "not just X but Y", triple enumerations, dash-separated punchlines, and broetry patterns in general. When in doubt, refer to the about page or the BCN map copy as the reference register.

Files under .claude/ are agent-facing only. Write for comprehension, not readability. Omit flourish, bend grammar freely if meaning stays unambiguous, prefer dense over verbose.

## Language
All code, data schemas, column names, JSON keys, and GeoJSON property names must be in English. Geographic proper nouns (place names like "el Raval", "Eixample") are kept in their original language as they are names, not labels.

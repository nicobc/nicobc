#!/usr/bin/env python3
import json

paths = [
    ".claude/board/rules.md",
    "RELEASING.md",
    ".claude/board/index.yaml",
]

sections = []
for path in paths:
    with open(path) as f:
        sections.append(f"# {path}\n{f.read().strip()}")

ctx = "\n\n".join(sections)
ctx += (
    "\n\n---\n"
    "MANDATORY SESSION START: The board rules, release process, and board index above are now loaded. "
    "Run /orient now to complete initialization before doing anything else."
)

print(
    json.dumps(
        {
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "additionalContext": ctx,
            }
        }
    )
)

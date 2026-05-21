---
description: Copy standards for agent-facing content — skills, CLAUDE.md, board YAML, any file under .claude/
paths: ".claude/**/*"
---

# Agent Copy Standards

All `.claude/` content — skills, CLAUDE.md, board YAML tickets/notes/acceptance criteria — is read by the agent, not the user. Optimize for machine comprehension.

- Dense over verbose — omit words that don't change meaning
- Imperative over explanatory — state the rule, not the reasoning behind it unless the reasoning changes how the rule is applied
- Bend grammar freely if meaning stays unambiguous
- No flourish, no hedging, no transitional filler ("note that", "keep in mind", "it is worth mentioning")
- Prefer flat bullet lists over prose paragraphs for rules and constraints

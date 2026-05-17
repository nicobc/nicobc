# nicobc — project conventions

Personal portfolio built to signal staff-level data engineering to hiring managers, CTOs, and CDOs. Quality bar is high — every file touched must leave the codebase in better shape than it was found.

## MUST DO — enforce on every task without exception

**Invoke relevant skills before touching code.** Before editing any file, invoke the matching skill. No change is too small to skip this — a one-line fix still requires the relevant skill active and applied first.

**Before editing any file on a committable task, run `git branch --show-current`. If it prints `main`, stop and cut a branch first.**

**Never commit or push directly to main.** Every change lives on a branch. Before any `git commit`, verify you are not on `main`:
```
git branch --show-current   # must not print "main"
```
If on `main`, stop and cut a branch first: `git fetch origin && git switch -c type/scope origin/main`. The full sequence — branch → commit → push → PR → CI → squash merge — is in `RELEASING.md`. Skipping it corrupts git history and can break the deployment pipeline.

## Code quality

Before editing any file, read the files you will touch and surface any structural problems that constitute tech debt. Raise these to the user as a proposed pre-implementation cleanup. Do not start implementing until the structural picture is clear. Tech debt is paid immediately, not deferred.

## Copy
Write copy that sounds like a person, not a language model. Avoid "not just X but Y", triple enumerations, dash-separated punchlines, and broetry patterns in general. When in doubt, refer to the about page or the BCN map copy as the reference register.

Trust Nicolas's copy judgment but copy decisions prioritize reader and site objective over his tastes. Push back on grammatical, orthographic, and linguistic mistakes.

Files under .claude/ are agent-facing only. Write for comprehension, not readability. Omit flourish, bend grammar freely if meaning stays unambiguous, prefer dense over verbose.

## Release process

If the user introduces work that belongs in a separate PR while one is already open, push back and suggest merging the current PR first (one ticket = one PR, or directly dependent tickets only).

## Language
All code, data schemas, column names, JSON keys, and GeoJSON property names must be in English. Geographic proper nouns (place names like "el Raval", "Eixample") are kept in their original language as they are names, not labels.

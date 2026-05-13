---
description: Angular coding standards for this project (HTML, TS, SCSS)
paths: "app/src/**/*.{ts,html,scss}"
---

# Angular Standards

## Separation of concerns
HTML arranges structure. TS owns all content.

- Pure-text sequences → typed array in TS, rendered with `@for` + `{{ }}`
- Inline `<code>` in running text → `[innerHTML]` with a hardcoded string literal in TS (`<code>` is styled globally)
- Inline `<a>` in running text → keep `<a>` in the template; bind surrounding text via `{{ before }}<a ...>{{ label }}</a>{{ after }}` — never put `<a>` inside `[innerHTML]` (component-scoped link styles won't reach it)
- `[innerHTML]` only for `<br>` or `<code>` markup; never for `<a>` or anything that needs component-scoped styles
- `[innerHTML]` only with string literals defined in the TS file — never with user-supplied or API-sourced strings
- No hardcoded text between opening and closing tags in the template

## Encapsulation and factorization
Define every reusable unit at the smallest scope that covers all its consumers.

- Reuse existing styles before defining new ones — style consistency is the default
- New styles defined with reusability in mind; if reusable, they go in `styles.scss`
- Used in one component only → component `.ts` or `.scss`
- Shared TS logic → service or a purposefully named file
- Shared SCSS → `styles.scss`; no other shared partials
- SCSS design tokens (colors, spacing, font sizes) → CSS custom properties on `:root` in `styles.scss`, consumed via `var(--token)`

## Naming
- Verb-first method and function names — non-negotiable
- Every name must be expressive: clarity > conciseness; conciseness still matters
- Applies universally — variables, functions, classes, files, selectors; no name is too small to be clear

## Visual quality
- Maximize data-to-ink ratio: every rendered element must earn its place
- Visual elements (spacing, borders, color) should communicate structure, hierarchy, or state
- Prefer CSS over extra DOM nodes for visual effects

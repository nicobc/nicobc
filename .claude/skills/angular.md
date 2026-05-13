---
description: Angular coding standards for this project (HTML, TS, SCSS)
paths: "app/src/**/*.{ts,html,scss}"
---

# Angular Standards

## Separation of concerns
HTML arranges structure. TS owns all content.

- Pure-text sequences → typed array in TS, rendered with `@for` + `{{ }}`
- Inline `<code>` in running text → `[innerHTML]` with a string defined in TS (`<code>` is styled globally)
- Inline `<a>` in running text → keep `<a>` in the template; bind surrounding text via `{{ before }}<a ...>{{ label }}</a>{{ after }}` — never put `<a>` inside `[innerHTML]` (component-scoped link styles won't reach it)
- `[innerHTML]` only for `<br>` or `<code>` markup; never for `<a>` or anything that needs component-scoped styles
- `[innerHTML]` only with strings from TS — hardcoded literals or computed values derived from internal data; never with user-supplied or API-sourced strings (XSS risk)
- No hardcoded text between opening and closing tags in the template — includes button labels, link text, loading messages, step counts, and any copy. HTML entities used purely as decorative symbols (←, →, ×, ↺) are exempt.

## Encapsulation and factorization
Define every reusable unit at the smallest scope that covers all its consumers.

- Reuse existing styles before defining new ones — style consistency is the default
- New styles defined with reusability in mind; if reusable, they go in `styles.scss`
- Used in one component only → component `.ts` or `.scss`
- Shared TS logic, functions, and interfaces → service or a purposefully named file; types follow the same scoping rule as functions
- Shared components must not import from page components — dependency flows inward (pages → shared), never outward
- Shared SCSS → `styles.scss`; no other shared partials
- SCSS design tokens (colors, spacing, font sizes) → CSS custom properties on `:root` in `styles.scss`, consumed via `var(--token)`
- Don't wrap imported functions in private aliases — call them directly

## Signals and reactivity
- All signals declared as `readonly` — prevents reassigning the signal reference
- Derived values that read from signals → `computed()`, not plain getters; computed signals are memoized and tracked by the signal graph; getters re-run on every change detection cycle
- `$any()` casts in templates are a smell — use a typed event handler in TS instead

## DOM access
- Prefer `ElementRef.nativeElement.querySelector()` over `document.querySelector()` for component-scoped DOM queries — scopes the search to the component's subtree
- `@ViewChild` is preferred when the target element is unconditionally present; `ElementRef.nativeElement.querySelector()` is acceptable when the target is conditionally rendered

## Naming
- Verb-first method and function names — non-negotiable
- Every name must be expressive: clarity > conciseness; conciseness still matters
- Applies universally — variables, functions, classes, files, selectors; no name is too small to be clear

## Visual quality
- Maximize data-to-ink ratio: every rendered element must earn its place
- Visual elements (spacing, borders, color) should communicate structure, hierarchy, or state
- Prefer CSS over extra DOM nodes for visual effects

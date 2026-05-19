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

- Repeated template structure (same layout, different data across N steps or items) → extract a sub-component with a config `@Input()`. The parent becomes a coordinator: it holds state, builds configs, and routes `@Output()` events. One instance of the template, driven by data.
- A component that handles page layout, per-step logic, and modal lifecycle simultaneously is a god object — split it. Each component should have one clear job.
- When extracting a sub-component, prefer a single config interface `@Input()` over many individual `@Input()` fields when the inputs are logically cohesive and always set together. This keeps the parent template flat and makes step-indexed config arrays natural.
- Separate data from behavior: SQL strings, expected-output fixtures, label arrays, and other pure data belong in a sibling `component.data.ts` file. The component file should contain only types, helpers, and the class. You don't need to read the data to understand the logic; keeping them together inflates the file and adds noise.
- Always use `templateUrl` and `styleUrl` — no inline `template` or `styles`; keeps the class clean and HTML/SCSS independently editable
- Reuse existing styles before defining new ones — style consistency is the default
- New styles defined with reusability in mind; if reusable, they go in `styles.scss`
- Used in one component only → component `.ts` or `.scss`
- Shared TS logic, functions, and interfaces → service or a purposefully named file; types follow the same scoping rule as functions
- Shared components must not import from page components — dependency flows inward (pages → shared), never outward
- Shared SCSS → `styles.scss`; no other shared partials
- SCSS design tokens (colors, spacing, font sizes) → CSS custom properties on `:root` in `styles.scss`, consumed via `var(--token)`
- Don't wrap imported functions in private aliases — call them directly

## Signals and reactivity
- All signals and all class properties that are never reassigned declared as `readonly` — applies to icon refs, label strings, config arrays, and any other fixed member, not just signals
- Derived values that read from signals → `computed()`, not plain getters; computed signals are memoized and tracked by the signal graph; getters re-run on every change detection cycle
- `$any()` casts in templates are a smell — use a typed event handler in TS instead

## DOM access
- Prefer `ElementRef.nativeElement.querySelector()` over `document.querySelector()` for component-scoped DOM queries — scopes the search to the component's subtree
- `@ViewChild` is preferred when the target element is unconditionally present; `ElementRef.nativeElement.querySelector()` is acceptable when the target is conditionally rendered

## Accessibility
- Global `:focus-visible` style defined in `styles.scss` using `var(--fg)` — do not override in component SCSS
- Modal overlays: `role="dialog" aria-modal="true" aria-label="..."` on the panel element; `(keydown)="trapFocus($event)"` on the same element
- On open: `setTimeout(() => panel.querySelector<HTMLElement>('input:not([disabled]), button:not([disabled])')?.focus())`
- On close: return focus to the trigger with `this.triggerRef?.nativeElement.focus()`
- Focus trap: on Tab/Shift+Tab, if at last/first focusable child, wrap to first/last and call `event.preventDefault()`
- Store both trigger ref and panel ref with `@ViewChild` (`ElementRef`)

## Naming
- Verb-first method and function names — non-negotiable
- Every name must be expressive: clarity > conciseness; conciseness still matters
- Applies universally — variables, functions, classes, files, selectors; no name is too small to be clear

## Visual quality
- Maximize data-to-ink ratio: every rendered element must earn its place
- Visual elements (spacing, borders, color) should communicate structure, hierarchy, or state
- Prefer CSS over extra DOM nodes for visual effects
- Slick over safe: when visual choices exist, pick the clean and confident one, not the cautious one
- Any visible state change (expand/collapse, show/hide, active/inactive) must transition — no hard cuts. Easing is baked into `var(--transition)` and `var(--transition-fast)`; use them directly without appending an easing keyword.

## Design system
Full system defined in `styles.scss` — read it before styling anything. Key rules:

**Token rule:** all visual style values — opacity, font-size, font-weight, font-family, border-radius, transition duration — must use a CSS custom property from `:root`. Raw values for these properties are not allowed in component SCSS files. If the right token doesn't exist, add it to `styles.scss`.
- Tokens: `--opacity-{faint|dim|subtle|muted|secondary}`, `--fs-{xs|code|sm|base|lg|xl|2xl}`, `--fw-{light|medium|semibold|bold}`, `--br-{sm|·|md|lg}`, `--transition{-fast|}`, `--font-mono`, border and surface tokens
- Positional/sizing values (width, height, margin, padding, top, left, gap, clamp() ramps) are component-specific — raw values are fine

**Named carve-outs (raw values allowed):**
- `@keyframes` opacity (0/1 are animation mechanics, not visual style)
- `bcn-map` font sizes below `--fs-xs` (0.75rem) — map label hierarchy encodes visual depth; raw values in that file parallel the data-viz color exemption in `data-movement-viz.scss`
- Hover transition targets above `--opacity-strong` (0.8) — `opacity: 0.85` or `opacity: 1` on `:hover` are directional targets, not style declarations
- Near-full opacity (0.85) inside button class definitions in `styles.scss` — design system internal

**Button classes:** `btn-primary`, `btn-ghost`, `btn-outline`, `btn-icon` — check `styles.scss` before writing a new button style.
**Utilities:** `eyebrow`, `code-block`, `code-input` — global; do not redefine in component SCSS.
**Positional overrides** for global classes belong in the component SCSS; visual style overrides do not.

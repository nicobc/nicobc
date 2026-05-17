---
description: Angular unit testing standards for this project
paths: "app/src/**/*.spec.ts"
---

# Angular Testing Standards

## Philosophy

Test behavior, not implementation details. A spec earns its place when it
verifies what a unit does — its state transitions, its outputs given inputs —
not how it renders or what its template contains.

Three tiers, in ascending overhead order:

1. **Pure functions** — import and call. No TestBed. `challenge-validators.spec.ts`
   is the reference.
2. **Signal-based classes** — instantiate directly, call methods, read signal
   values. No DOM, no TestBed.
3. **Component behavior** — use TestBed only when behavior is inherently tied to
   the component lifecycle: `@Input()` → state change, user interaction →
   `@Output()` emission, conditional rendering driven by signal state.

If TestBed setup is the heaviest thing in a spec, the unit has no behavior worth
testing. "should create" is the right ceiling for display-only components — it
verifies the DI tree is wired correctly and is sufficient.

If isolating a unit requires extensive service mocking, the component has too
many responsibilities. Fix the design rather than the test.

## What not to test

- Template structure: CSS classes, rendered text, element presence for static content
- Angular framework behavior: routing, change detection cycles, lifecycle hooks
- Display-only components beyond "should create": no inputs, no outputs, no state
- Third-party library behavior: DuckDB, SQL parsers, icon libraries
- Private methods and private signals
- Services whose behavior is obvious (one-liner toggles) or tightly coupled to
  browser APIs (localStorage, matchMedia) — that's integration territory

## Tooling

Vitest + Angular TestBed (project default). No additional testing utilities.
Use `.toBe(true)` / `.toBe(false)` for boolean assertions — Vitest does not
have Jasmine's `toBeTrue()` / `toBeFalse()`. No `spyOn` on internal methods —
if a method needs spying, it should be an observable boundary, not an
implementation detail.

## Structure

### File location

Spec is a sibling of the file under test:

```
app/src/app/foo/foo.ts → app/src/app/foo/foo.spec.ts
```

### Pure function

```typescript
import { myFn } from './my-module';

describe('myFn', () => {
  const cases: { id: string; input: Input; expected: Output }[] = [
    { id: 'behavior description — not an ordinal', input: ..., expected: ... },
  ];

  cases.forEach(({ id, input, expected }) => {
    it(id, () => {
      expect(myFn(input)).toEqual(expected);
    });
  });
});
```

### Signal-based class

```typescript
import { ChallengeController } from './challenge-controller';

describe('ChallengeController', () => {
  it('open resets to initial state even after reveal', () => {
    // Arrange
    const ctrl = new ChallengeController('idle');
    ctrl.reveal();

    // Act
    ctrl.open();

    // Assert
    expect(ctrl.show()).toBeTrue();
    expect(ctrl.solutionRevealed()).toBeFalse();
    expect(ctrl.state()).toBe('idle');
  });
});
```

Signal values are read by calling the signal: `ctrl.mySignal()`. The signal
graph is synchronous — no `detectChanges()` needed for signal assertions.

### Component with behavior

```typescript
describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('behavior description', () => {
    // Arrange — set inputs, configure initial state
    // Act   — one call, one event, one interaction
    // Assert — read signal values or query DOM for behavioral output
  });
});
```

Call `fixture.detectChanges()` only when asserting on rendered DOM, not on
signal state. Prefer `await fixture.whenStable()` after async-triggering actions.
Avoid `fakeAsync`/`tick` unless timing is the explicit behavior under test.

## AAA

Every `it` block: Arrange → Act → Assert, one concern per phase.

- **Arrange**: create subject, set inputs, configure state; complex shared setup
  goes in `beforeEach`, scenario-specific setup stays in `it`
- **Act**: one call, one event, one interaction
- **Assert**: as many `expect` calls as the behavior has observable effects;
  never transform `actual` before asserting — fix it at the source

## Naming

```
describe:  export name, verbatim           — ChallengeController, checkCapstoneStructure
it:        present-tense behavior spec    — "open resets state to initial on re-entry"
           not: "should open"             — incomplete
           not: "test open method"        — describes structure, not behavior
```

No "should" prefix on `it` strings. State the behavior directly.

Parametrize `id` fields read as behavior descriptions, not ordinals:
`"zero CTEs — flat query relies on optimizer pushdown"`, not `"case 0"`.

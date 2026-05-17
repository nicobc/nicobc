import { signal, Signal, WritableSignal } from '@angular/core';

export interface ChallengeHandle {
  readonly show: Signal<boolean>;
  readonly state: Signal<string>;
  readonly checking: Signal<boolean>;
  readonly solutionRevealed: Signal<boolean>;
  open(): void;
  close(): void;
  reveal(): void;
  check(fn: () => Promise<void>): Promise<void>;
}

export class ChallengeController<TState extends string> implements ChallengeHandle {
  readonly show = signal(false);
  readonly state: WritableSignal<TState>;
  readonly solutionRevealed = signal(false);
  readonly checking = signal(false);

  constructor(private readonly initialState: TState) {
    this.state = signal(initialState);
  }

  open(): void {
    this.state.set(this.initialState);
    this.solutionRevealed.set(false);
    this.checking.set(false);
    this.show.set(true);
  }

  close(): void {
    this.show.set(false);
  }

  async check(fn: () => Promise<void>): Promise<void> {
    this.checking.set(true);
    try {
      await fn();
    } finally {
      this.checking.set(false);
    }
  }

  reveal(): void {
    this.solutionRevealed.set(true);
    this.state.set('correct' as TState);
  }
}

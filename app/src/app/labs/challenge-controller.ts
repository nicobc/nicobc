import { signal, Signal, WritableSignal } from '@angular/core';

export interface ChallengeHandle {
  readonly state: Signal<string>;
  readonly checking: Signal<boolean>;
  restart(): void;
  check(fn: () => Promise<void>): Promise<void>;
}

export class ChallengeController<TState extends string> implements ChallengeHandle {
  readonly state: WritableSignal<TState>;
  readonly checking = signal(false);

  constructor(private readonly initialState: TState) {
    this.state = signal(initialState);
  }

  restart(): void {
    this.state.set(this.initialState);
    this.checking.set(false);
  }

  async check(fn: () => Promise<void>): Promise<void> {
    this.checking.set(true);
    try {
      await fn();
    } finally {
      this.checking.set(false);
    }
  }
}

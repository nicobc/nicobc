import { signal, Signal, WritableSignal } from '@angular/core';

export interface ChallengeHandle {
  readonly show: Signal<boolean>;
  readonly state: Signal<string>;
  readonly checking: Signal<boolean>;
  open(): void;
  restart(): void;
  close(): void;
  check(fn: () => Promise<void>): Promise<void>;
}

export class ChallengeController<TState extends string> implements ChallengeHandle {
  readonly show = signal(false);
  readonly state: WritableSignal<TState>;
  readonly checking = signal(false);

  constructor(private readonly initialState: TState) {
    this.state = signal(initialState);
  }

  open(): void {
    this.state.set(this.initialState);
    this.checking.set(false);
    this.show.set(true);
  }

  restart(): void {
    this.state.set(this.initialState);
    this.checking.set(false);
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
}

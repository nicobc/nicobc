import { signal, WritableSignal } from '@angular/core';

export class ChallengeController<TState extends string> {
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
}

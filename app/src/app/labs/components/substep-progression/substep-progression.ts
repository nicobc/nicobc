import { Component, computed, EventEmitter, Input, OnChanges, Output, signal, Signal } from '@angular/core';

export type Substep = { kind: 'free' } | { kind: 'gated'; done: Signal<boolean> };
export type Substeps = Substep[];

@Component({
  selector: 'app-substep-progression',
  templateUrl: './substep-progression.html',
  styleUrl: './substep-progression.scss',
})
export class SubstepProgression implements OnChanges {
  @Input({ required: true }) substeps!: Substeps;
  @Output() readonly exitBack = new EventEmitter<void>();

  readonly activeIndex = signal(0);
  readonly canAdvance = computed(() => {
    const s = this.substeps[this.activeIndex()];
    if (!s) return false;
    return s.kind === 'free' || s.done();
  });

  ngOnChanges(): void {
    this.activeIndex.set(0);
  }

  goBack(): void {
    const i = this.activeIndex();
    if (i === 0) {
      this.exitBack.emit();
      return;
    }
    this.activeIndex.set(i - 1);
  }

  goForward(): void {
    if (!this.canAdvance()) return;
    const next = this.activeIndex() + 1;
    if (next < this.substeps.length) this.activeIndex.set(next);
  }
}

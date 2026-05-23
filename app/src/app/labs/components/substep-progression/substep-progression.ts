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
  @Input() hasNext = true;
  @Input() hasPrev = true;
  @Output() readonly exitBack = new EventEmitter<void>();
  @Output() readonly exitForward = new EventEmitter<void>();

  readonly activeIndex = signal(0);
  private readonly substepsLength = signal(0);

  readonly isFirst = computed(() => this.activeIndex() === 0);
  readonly isLast = computed(() => this.activeIndex() === this.substepsLength() - 1);

  readonly canAdvance = computed(() => {
    const s = this.substeps[this.activeIndex()];
    if (!s) return false;
    return s.kind === 'free' || s.done();
  });

  readonly showBack = computed(() => !this.isFirst() || this.hasPrev);
  readonly showForward = computed(() => this.canAdvance());

  protected readonly backLabel = '← Back';
  protected readonly continueLabel = 'Continue →';
  protected readonly doneLabel = 'Done';

  ngOnChanges(): void {
    this.activeIndex.set(0);
    this.substepsLength.set(this.substeps.length);
  }

  goBack(): void {
    if (this.isFirst()) {
      this.exitBack.emit();
      return;
    }
    this.activeIndex.update((i) => i - 1);
  }

  goForward(): void {
    if (!this.canAdvance()) return;
    if (this.isLast()) {
      this.exitForward.emit();
      return;
    }
    this.activeIndex.update((i) => i + 1);
  }
}

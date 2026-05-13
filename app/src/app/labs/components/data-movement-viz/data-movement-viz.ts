import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, signal } from '@angular/core';

export type VizScenario = 'column-pruning' | 'predicate-pushdown' | 'shuffle';
export type PruningMode = 'unpruned' | 'pruned';

@Component({
  selector: 'app-data-movement-viz',
  imports: [],
  templateUrl: './data-movement-viz.html',
  styleUrl: './data-movement-viz.scss',
})
export class DataMovementViz implements OnInit, OnChanges {
  @Input({ required: true }) scenario!: VizScenario;
  @Output() readonly modeChange = new EventEmitter<PruningMode>();

  readonly cpToggleUnpruned = 'SELECT *';
  readonly cpTogglePruned = 'SELECT customer_id, customer_name';
  readonly cpFromClause = 'FROM dim_customers';

  readonly animating = signal(false);
  readonly pruningMode = signal<PruningMode>('unpruned');

  ngOnInit() {
    setTimeout(() => this.animating.set(true), 50);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scenario'] && !changes['scenario'].firstChange) {
      this.pruningMode.set('unpruned');
      this.animating.set(false);
      setTimeout(() => this.animating.set(true), 50);
    }
  }

  setPruningMode(mode: PruningMode) {
    if (this.pruningMode() === mode) return;
    this.pruningMode.set(mode);
    this.animating.set(false);
    this.modeChange.emit(mode);
    setTimeout(() => this.animating.set(true), 20);
  }

  replay() {
    this.animating.set(false);
    setTimeout(() => this.animating.set(true), 20);
  }
}

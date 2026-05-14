import { Component, computed, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, signal } from '@angular/core';

export type VizScenario = 'column-pruning' | 'predicate-pushdown' | 'shuffle';
export type PruningMode = 'unpruned' | 'pruned';
export type PushdownMode = 'unpushed' | 'pushed';
export type VizMode = PruningMode | PushdownMode;

@Component({
  selector: 'app-data-movement-viz',
  imports: [],
  templateUrl: './data-movement-viz.html',
  styleUrl: './data-movement-viz.scss',
})
export class DataMovementViz implements OnInit, OnChanges {
  @Input({ required: true }) scenario!: VizScenario;
  @Output() readonly modeChange = new EventEmitter<VizMode>();

  readonly cpToggleUnpruned = 'SELECT *';
  readonly cpTogglePruned = 'SELECT customer_id, customer_name, country';
  readonly cpFromClause = 'FROM dim_customers';

  readonly pushdownToggleUnpushed = "WITH kpi AS (\n  SELECT … FROM dim_customers\n  …\n)\nSELECT … FROM kpi\nWHERE country = 'Spain'";
  readonly pushdownTogglePushed = "WITH kpi AS (\n  SELECT … FROM dim_customers\n  WHERE country = 'Spain'\n  …\n)\nSELECT … FROM kpi";

  readonly unpushed: PushdownMode = 'unpushed';
  readonly pushed: PushdownMode = 'pushed';

  readonly animating = signal(false);
  readonly pruningMode = signal<PruningMode>('unpruned');
  readonly pushdownMode = signal<PushdownMode>('unpushed');

  readonly isFilterUnpushed = computed(() => this.pushdownMode() === 'unpushed');
  readonly isFilterPushed = computed(() => this.pushdownMode() === 'pushed');

  ngOnInit() {
    setTimeout(() => this.animating.set(true), 50);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scenario'] && !changes['scenario'].firstChange) {
      this.pruningMode.set('unpruned');
      this.pushdownMode.set('unpushed');
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

  setPushdownMode(mode: PushdownMode) {
    if (this.pushdownMode() === mode) return;
    this.pushdownMode.set(mode);
    this.animating.set(false);
    this.modeChange.emit(mode);
    setTimeout(() => this.animating.set(true), 20);
  }

  replay() {
    this.animating.set(false);
    setTimeout(() => this.animating.set(true), 20);
  }
}

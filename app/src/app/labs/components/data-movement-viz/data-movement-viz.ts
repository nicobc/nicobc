import {
  Component,
  computed,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { DIM_CUSTOMERS } from '../../data/schema';
import { DagRaceViz } from '../dag-race-viz/dag-race-viz';

export type VizScenario = 'column-pruning' | 'predicate-pushdown' | 'dag-race';
export type PruningMode = 'unpruned' | 'pruned';
export type PushdownMode = 'unpushed' | 'pushed';
export type DagRaceMode = 'dag-race-done';
export type VizMode = PruningMode | PushdownMode | DagRaceMode;

@Component({
  selector: 'app-data-movement-viz',
  imports: [DagRaceViz],
  templateUrl: './data-movement-viz.html',
  styleUrl: './data-movement-viz.scss',
})
export class DataMovementViz implements OnInit, OnChanges {
  @Input({ required: true }) scenario!: VizScenario;
  @Output() readonly modeChange = new EventEmitter<VizMode>();

  @ViewChild(DagRaceViz) private readonly dagRaceRef?: DagRaceViz;

  readonly cpToggleUnpruned = 'SELECT *';
  readonly cpTogglePruned = 'SELECT customer_id, customer_name, country';
  readonly cpFromClause = `FROM ${DIM_CUSTOMERS}`;

  readonly ppSelectFrom = `SELECT *\nFROM ${DIM_CUSTOMERS}`;
  readonly ppWhereClause = "WHERE country = 'Spain'";

  readonly animating = signal(false);
  readonly pruningMode = signal<PruningMode>('unpruned');
  readonly pushdownMode = signal<PushdownMode>('unpushed');

  readonly isFilterUnpushed = computed(() => this.pushdownMode() === 'unpushed');
  readonly isFilterPushed = computed(() => this.pushdownMode() === 'pushed');

  ngOnInit() {
    if (this.scenario !== 'dag-race') {
      setTimeout(() => this.animating.set(true), 50);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scenario'] && !changes['scenario'].firstChange) {
      this.pruningMode.set('unpruned');
      this.pushdownMode.set('unpushed');
      if (this.scenario !== 'dag-race') {
        this.animating.set(false);
        setTimeout(() => this.animating.set(true), 50);
      }
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

  togglePushdown(): void {
    this.setPushdownMode(this.pushdownMode() === 'pushed' ? 'unpushed' : 'pushed');
  }

  replay(): void {
    if (this.scenario === 'dag-race') {
      this.dagRaceRef?.restart();
    } else {
      this.animating.set(false);
      setTimeout(() => this.animating.set(true), 20);
    }
  }

  onDagRaceDone(): void {
    this.modeChange.emit('dag-race-done');
  }
}

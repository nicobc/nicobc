import { Component, EventEmitter, OnDestroy, OnInit, Output, signal } from '@angular/core';

const ANIMATION_MS = 8100;

@Component({
  selector: 'app-dag-race-viz',
  imports: [],
  templateUrl: './dag-race-viz.html',
  styleUrl: './dag-race-viz.scss',
})
export class DagRaceViz implements OnInit, OnDestroy {
  @Output() readonly done = new EventEmitter<void>();

  readonly animating = signal(false);

  readonly baselineLabel = 'Baseline';
  readonly optimisedLabel = 'Optimised';
  readonly scanLabel = 'Scan';
  readonly joinLabel = 'Join';
  readonly filterLabel = 'Filter';
  readonly projectLabel = 'Project';
  readonly aggregateLabel = 'Aggregate';
  readonly sortLimitLabel = 'Sort · Limit';

  readonly dimCustomersAlias = 'dim_customers';
  readonly fctOrdersAlias = 'fct_orders';
  readonly joinedAlias = 'joined';

  // Baseline detail texts
  readonly bScanCDetail = 'all cols · all rows';
  readonly bScanODetail = 'all cols · all rows';
  readonly bJoinDetail = 'all cols · all matched rows';
  readonly bFilterDetail = 'all cols · Spanish matched rows';
  readonly bProjectDetail = '2 cols · Spanish matched rows';
  readonly bAggDetail = '2 cols · grouped rows';
  readonly bSortDetail = 'top 5';

  // Optimised detail texts
  readonly oScanCDetail = '2 cols · Spanish rows';
  readonly oScanODetail = '2 cols · all rows';
  readonly oJoinDetail = '3 cols · Spanish matched rows';
  readonly oProjectDetail = '2 cols · Spanish matched rows';
  readonly oAggDetail = '2 cols · grouped rows';
  readonly oSortDetail = 'top 5';

  private doneTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    setTimeout(() => this.startAnimation(), 50);
  }

  ngOnDestroy(): void {
    clearTimeout(this.doneTimer);
  }

  restart(): void {
    clearTimeout(this.doneTimer);
    this.animating.set(false);
    setTimeout(() => this.startAnimation(), 20);
  }

  private startAnimation(): void {
    this.animating.set(true);
    this.doneTimer = setTimeout(() => this.done.emit(), ANIMATION_MS);
  }
}

import { Component, HostListener, ViewChild, signal } from '@angular/core';
import { DataMovementViz, PruningMode, VizScenario } from '../../labs/components/data-movement-viz/data-movement-viz';

const SCENARIOS: VizScenario[] = ['column-pruning', 'predicate-pushdown', 'shuffle'];
const CONCEPT_NAMES = ['Column pruning', 'Predicate pushdown', 'Shuffle'];
const CHALLENGE_ANSWER = new Set(['product_id', 'category']);
const CHALLENGE_ANSWER_TEXT = 'product_id, category';

@Component({
  selector: 'app-distributed-computing',
  imports: [DataMovementViz],
  templateUrl: './distributed-computing.html',
  styleUrl: './distributed-computing.scss',
})
export class DistributedComputing {
  @ViewChild(DataMovementViz) private viz?: DataMovementViz;

  readonly step = signal<1 | 2 | 3>(1);
  readonly phase = signal<'viz' | 'copy'>('viz');
  readonly seenPruning = signal(false);

  readonly showChallenge = signal(false);
  readonly challengeState = signal<'unanswered' | 'wrong' | 'correct'>('unanswered');
  readonly solutionRevealed = signal(false);
  readonly challengeInput = signal('');

  readonly queryBefore = 'WITH enriched_items AS (\n  SELECT ';
  readonly queryAfter = '\n  FROM dim_products\n),\ncategory_revenue AS (\n  SELECT\n    p.category,\n    SUM(i.quantity * i.unit_price) AS revenue\n  FROM enriched_items p\n  JOIN fct_order_items i ON p.product_id = i.product_id\n  GROUP BY p.category\n)\nSELECT category, revenue\nFROM category_revenue\nORDER BY revenue DESC';

  get scenario(): VizScenario {
    return SCENARIOS[this.step() - 1];
  }

  get conceptName(): string {
    return CONCEPT_NAMES[this.step() - 1];
  }

  replay() {
    this.viz?.replay();
  }

  onModeChange(mode: PruningMode) {
    if (mode === 'pruned') this.seenPruning.set(true);
  }

  advanceVizPhase() {
    this.phase.set('copy');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  backToViz() {
    this.phase.set('viz');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  goNext() {
    const next = (this.step() + 1) as 2 | 3;
    this.step.set(next);
    this.phase.set('viz');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  goBack() {
    const prev = (this.step() - 1) as 1 | 2;
    this.step.set(prev);
    this.phase.set('copy');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showChallenge()) this.closeChallenge();
  }

  openChallenge() {
    this.challengeInput.set('');
    this.challengeState.set('unanswered');
    this.solutionRevealed.set(false);
    this.showChallenge.set(true);
  }

  closeChallenge() {
    this.showChallenge.set(false);
  }

  submitChallenge() {
    const tokens = this.challengeInput()
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);
    const actual = new Set(tokens);
    const correct = actual.size === CHALLENGE_ANSWER.size && [...CHALLENGE_ANSWER].every(c => actual.has(c));
    this.challengeState.set(correct ? 'correct' : 'wrong');
  }

  revealSolution() {
    this.challengeInput.set(CHALLENGE_ANSWER_TEXT);
    this.solutionRevealed.set(true);
    this.challengeState.set('correct');
  }

  advanceFromChallenge() {
    this.showChallenge.set(false);
    this.goNext();
  }
}

import { Component, computed, ElementRef, HostListener, ViewChild, signal } from '@angular/core';
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
  @ViewChild('challengePanel') private challengePanel?: ElementRef<HTMLElement>;
  @ViewChild('challengeTrigger') private challengeTrigger?: ElementRef<HTMLButtonElement>;

  readonly step = signal<1 | 2 | 3>(1);
  readonly phase = signal<'viz' | 'copy'>('viz');
  readonly seenPruning = signal(false);

  readonly showChallenge = signal(false);
  readonly challengeState = signal<'unanswered' | 'wrong' | 'correct'>('unanswered');
  readonly solutionRevealed = signal(false);
  readonly challengeInput = signal('');

  readonly queryBefore = 'WITH enriched_items AS (\n  SELECT ';
  readonly queryAfter = '\n  FROM dim_products\n),\ncategory_revenue AS (\n  SELECT\n    p.category,\n    SUM(i.quantity * i.unit_price) AS revenue\n  FROM enriched_items p\n  JOIN fct_order_items i ON p.product_id = i.product_id\n  GROUP BY p.category\n)\nSELECT category, revenue\nFROM category_revenue\nORDER BY revenue DESC';

  readonly totalSteps = SCENARIOS.length;
  readonly replayLabel = 'Replay';
  readonly backToAnimationLabel = 'Back to animation';
  readonly testUnderstandingLabel = 'Test your understanding';
  readonly checkLabel = 'Check';
  readonly revealSolutionLabel = 'Reveal solution';
  readonly nextLabel = 'Next';

  readonly labCategory = 'Data Engineering · Distributed';
  readonly labTitle = "What the optimizer won't fix";

  readonly copyPara1 = 'We need two columns from <code>dim_customers</code> to retrieve the top 5 Spanish customers: <code>customer_id</code> to join on, and <code>customer_name</code> for the output. The table may store more — e.g., email and phone number — none of which this query uses.';
  readonly copyPara2Before = '<code>SELECT *</code> scans the full width of the table, while <code>SELECT customer_id, customer_name</code> only projects the needed columns. ';
  readonly copyPara2After = ' may push this projection down automatically; but they do not always. When a query is slow and you pull up the execution plan, column pruning is one of the first things to check.';
  readonly olapEnginesHref = 'https://en.wikipedia.org/wiki/Column-oriented_DBMS';
  readonly olapEnginesLabel = 'OLAP engines';

  readonly challengeSchema = '<code>dim_products</code> — product_id, product_name, category, sku, supplier_id, cost_price, list_price, weight_kg, reorder_threshold, created_at';
  readonly feedbackWrong = 'Not quite. Trace which columns the downstream CTEs actually use: <code>product_id</code> goes to the join condition, <code>category</code> to the group-by and final output. Everything else in <code>dim_products</code> travels to the compute node and gets discarded on arrival.';
  readonly feedbackCorrect = 'Right. <code>product_id</code> for the join, <code>category</code> for the group-by. Nothing else makes it to the output.';
  readonly feedbackCorrectRevealed = 'The answer is <code>product_id</code> and <code>category</code>. <code>product_id</code> threads through to the join condition; <code>category</code> goes to the group-by and final output. Everything else in <code>dim_products</code> is dead weight from the scan forward.';

  readonly scenario = computed<VizScenario>(() => SCENARIOS[this.step() - 1]);
  readonly conceptName = computed(() => CONCEPT_NAMES[this.step() - 1]);

  replay(): void {
    this.viz?.replay();
  }

  onModeChange(mode: PruningMode): void {
    if (mode === 'pruned') this.seenPruning.set(true);
  }

  advanceVizPhase(): void {
    this.phase.set('copy');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  returnToViz(): void {
    this.phase.set('viz');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  goNext(): void {
    const next = (this.step() + 1) as 2 | 3;
    this.step.set(next);
    this.phase.set('viz');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  goBack(): void {
    const prev = (this.step() - 1) as 1 | 2;
    this.step.set(prev);
    this.phase.set('copy');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showChallenge()) this.closeChallenge();
  }

  openChallenge(): void {
    this.challengeInput.set('');
    this.challengeState.set('unanswered');
    this.solutionRevealed.set(false);
    this.showChallenge.set(true);
    setTimeout(() => {
      const first = this.challengePanel?.nativeElement.querySelector<HTMLElement>(
        'input:not([disabled]), button:not([disabled])'
      );
      first?.focus();
    });
  }

  closeChallenge(): void {
    this.showChallenge.set(false);
    this.challengeTrigger?.nativeElement.focus();
  }

  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.challengePanel?.nativeElement;
    if (!panel) return;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]')
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onChallengeInput(event: Event): void {
    this.challengeInput.set((event.target as HTMLInputElement).value);
  }

  submitChallenge(): void {
    const tokens = this.challengeInput()
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);
    const actual = new Set(tokens);
    const correct = actual.size === CHALLENGE_ANSWER.size && [...CHALLENGE_ANSWER].every(c => actual.has(c));
    this.challengeState.set(correct ? 'correct' : 'wrong');
  }

  revealSolution(): void {
    this.challengeInput.set(CHALLENGE_ANSWER_TEXT);
    this.solutionRevealed.set(true);
    this.challengeState.set('correct');
  }

  advanceFromChallenge(): void {
    this.showChallenge.set(false);
    this.goNext();
  }
}

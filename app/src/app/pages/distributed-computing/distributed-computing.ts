import { Component, computed, ElementRef, ViewChild, signal } from '@angular/core';
import { Parser, Select } from 'node-sql-parser';
import { DataMovementViz, VizMode, VizScenario } from '../../labs/components/data-movement-viz/data-movement-viz';
import { ChallengeModal } from '../../labs/components/challenge-modal/challenge-modal';
import { ChallengeController } from '../../labs/challenge-controller';
import { execute, query, QueryResult } from '../../labs/db/duckdb';
import { dimProducts } from '../../labs/data/seed';

const SCENARIOS: VizScenario[] = ['column-pruning', 'predicate-pushdown', 'shuffle'];
const CONCEPT_NAMES = ['Column pruning', 'Predicate pushdown', 'Shuffle'];

const CHALLENGE_ANSWER = new Set(['product_id', 'category']);
const CHALLENGE_ANSWER_TEXT = 'product_id, category';

const PP_STARTING_SQL =
`WITH product_counts AS (
  SELECT category, COUNT(*) AS product_count
  FROM dim_products
  GROUP BY category
  HAVING COUNT(*) >= 2
    AND category != 'Food'
)
SELECT category, product_count
FROM product_counts
ORDER BY product_count DESC`;

const PP_SOLUTION_SQL =
`WITH product_counts AS (
  SELECT category, COUNT(*) AS product_count
  FROM dim_products
  WHERE category != 'Food'
  GROUP BY category
  HAVING COUNT(*) >= 2
)
SELECT category, product_count
FROM product_counts
ORDER BY product_count DESC`;

const PP_EXPECTED_ROWS = [
  { category: 'Electronics', product_count: 3 },
  { category: 'Tools',       product_count: 3 },
  { category: 'Clothing',    product_count: 2 },
];

type Step1State = 'unanswered' | 'wrong' | 'correct';
type PPState = 'unanswered' | 'wrong-both-having' | 'wrong-output' | 'wrong-sql' | 'correct';

const sqlParser = new Parser();

function hasColumnRef(expr: unknown, column: string): boolean {
  if (!expr || typeof expr !== 'object') return false;
  const node = expr as Record<string, unknown>;
  if (node['type'] === 'column_ref' && node['column'] === column) return true;
  return hasColumnRef(node['left'], column) || hasColumnRef(node['right'], column);
}

function checkPushdownStructure(sql: string): 'correct' | 'both-in-having' | 'other' {
  try {
    const result = sqlParser.astify(sql);
    const stmt = Array.isArray(result) ? result[0] : result;
    if (stmt.type !== 'select' || !stmt.with?.length) return 'other';
    const cte: Select = stmt.with[0].stmt.ast;
    const categoryInWhere = hasColumnRef(cte.where, 'category');
    const categoryInHaving = hasColumnRef(cte.having, 'category');
    if (categoryInWhere && !categoryInHaving) return 'correct';
    if (!categoryInWhere && categoryInHaving) return 'both-in-having';
    return 'other';
  } catch {
    return 'other';
  }
}

function matchesPPExpected(rows: QueryResult['rows']): boolean {
  if (rows.length !== PP_EXPECTED_ROWS.length) return false;
  return PP_EXPECTED_ROWS.every((exp, i) =>
    String(rows[i]['category']) === exp.category &&
    Number(rows[i]['product_count']) === exp.product_count
  );
}

@Component({
  selector: 'app-distributed-computing',
  imports: [DataMovementViz, ChallengeModal],
  templateUrl: './distributed-computing.html',
  styleUrl: './distributed-computing.scss',
})
export class DistributedComputing {
  @ViewChild(DataMovementViz) private viz?: DataMovementViz;
  @ViewChild('challengeTrigger') private challengeTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('ppChallengeTrigger') private ppChallengeTrigger?: ElementRef<HTMLButtonElement>;

  readonly step = signal<1 | 2 | 3>(1);
  readonly phase = signal<'viz' | 'copy'>('viz');
  readonly seenPruning = signal(false);
  readonly seenFilterPushed = signal(false);

  readonly step1Challenge = new ChallengeController<Step1State>('unanswered');
  readonly step2Challenge = new ChallengeController<PPState>('unanswered');

  readonly challengeInput = signal('');
  readonly ppChallengeSQL = signal(PP_STARTING_SQL);

  readonly totalSteps = SCENARIOS.length;
  readonly replayLabel = 'Replay';
  readonly backToAnimationLabel = 'Back to animation';
  readonly testUnderstandingLabel = 'Test your understanding';
  readonly checkLabel = 'Check';
  readonly checkingLabel = 'Checking…';
  readonly revealSolutionLabel = 'Reveal solution';
  readonly nextLabel = 'Next';

  readonly labCategory = 'Data Engineering · Distributed';
  readonly labTitle = "What the optimizer won’t fix";

  readonly copyPara1 = 'We need three columns from <code>dim_customers</code> to retrieve the top 5 Spanish customers: <code>customer_id</code> to join on, <code>customer_name</code> for the output, and <code>country</code> for the filter. The table also stores <code>created_at</code> and <code>updated_at</code> — none of which this query uses.';
  readonly copyPara2Before = '<code>SELECT *</code> scans the full width of the table, while <code>SELECT customer_id, customer_name, country</code> only projects the needed columns. ';
  readonly copyPara2After = ' may push this projection down automatically; but they do not always. When a query is slow and you pull up the execution plan, column pruning is one of the first things to check.';
  readonly olapEnginesHref = 'https://en.wikipedia.org/wiki/Column-oriented_DBMS';
  readonly olapEnginesLabel = 'OLAP engines';

  readonly challengeSchema = '<code>dim_products</code> — product_id, product_name, category, sku, supplier_id, cost_price, list_price, weight_kg, reorder_threshold, created_at';
  readonly queryBefore = 'WITH enriched_items AS (\n  SELECT ';
  readonly queryAfter = '\n  FROM dim_products\n),\ncategory_revenue AS (\n  SELECT\n    p.category,\n    SUM(i.quantity * i.unit_price) AS revenue\n  FROM enriched_items p\n  JOIN fct_order_items i ON p.product_id = i.product_id\n  GROUP BY p.category\n)\nSELECT category, revenue\nFROM category_revenue\nORDER BY revenue DESC';
  readonly feedbackWrong = 'Not quite. Trace which columns the downstream CTEs actually use: <code>product_id</code> goes to the join condition, <code>category</code> to the group-by and final output. Everything else in <code>dim_products</code> travels to the compute node and gets discarded on arrival.';
  readonly feedbackCorrect = 'Right. <code>product_id</code> for the join, <code>category</code> for the group-by. Nothing else makes it to the output.';
  readonly feedbackCorrectRevealed = 'The answer is <code>product_id</code> and <code>category</code>. <code>product_id</code> threads through to the join condition; <code>category</code> goes to the group-by and final output. Everything else in <code>dim_products</code> is dead weight from the scan forward.';

  readonly ppCopyPara1 = '<code>WHERE country = \'Spain\'</code> at the top level runs after the CTE closes — all 20 customers join with <code>fct_orders</code> before the French rows are dropped. That filter doesn\'t depend on any aggregated value, so it belongs inside the CTE, before the join. Same result, less data in motion.';
  readonly ppCopyPara2 = 'Query optimisers detect this kind of pushdown and apply it automatically when the query is simple and statistics are fresh. But it can fail across CTE boundaries in some engines, or when the planner\'s cost model is stale. Writing <code>WHERE country = \'Spain\'</code> inside the CTE makes the intent explicit, and keeps it efficient when the optimiser guesses wrong.';
  readonly ppChallengeSchema = '<code>dim_products</code> — product_id, product_name, category, sku, supplier_id, cost_price, list_price, weight_kg, reorder_threshold, created_at';
  readonly ppFeedbackBothHaving = 'Both predicates are in <code>HAVING</code>, which runs after <code>GROUP BY</code>. One of them doesn\'t depend on any aggregated value — which one can be evaluated before the rows are grouped?';
  readonly ppFeedbackWrongOutput = 'Structure looks right, but the result doesn\'t match. Check the filter value or the threshold.';
  readonly ppFeedbackWrongSQL = 'The query could not run. Check your SQL and try again.';
  readonly ppFeedbackCorrect = 'Right. <code>category != \'Food\'</code> belongs in <code>WHERE</code> — it filters rows before aggregation. <code>COUNT(*) >= 2</code> stays in <code>HAVING</code> — it needs the grouped result.';
  readonly ppFeedbackCorrectRevealed = 'The <code>category</code> filter belongs in <code>WHERE</code>: it doesn\'t depend on aggregated values and evaluating it before <code>GROUP BY</code> reduces the rows that enter the aggregation. <code>COUNT(*) >= 2</code> is a post-aggregation predicate — it can\'t move.';

  readonly scenario = computed<VizScenario>(() => SCENARIOS[this.step() - 1]);
  readonly conceptName = computed(() => CONCEPT_NAMES[this.step() - 1]);

  private ppDbReady = false;

  replay(): void {
    this.viz?.replay();
  }

  onModeChange(mode: VizMode): void {
    if (mode === 'pruned') this.seenPruning.set(true);
    if (mode === 'pushed') this.seenFilterPushed.set(true);
  }

  advanceVizPhase(): void {
    this.phase.set('copy');
    if (this.step() === 2) this.setupPPDatabase().catch(() => {});
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

  // ── step 1 challenge ──────────────────────────────────────────────────────────

  openChallenge(): void {
    this.challengeInput.set('');
    this.step1Challenge.open();
  }

  closeChallenge(): void {
    this.step1Challenge.close();
    this.challengeTrigger?.nativeElement.focus();
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
    this.step1Challenge.state.set(correct ? 'correct' : 'wrong');
  }

  revealSolution(): void {
    this.challengeInput.set(CHALLENGE_ANSWER_TEXT);
    this.step1Challenge.solutionRevealed.set(true);
    this.step1Challenge.state.set('correct');
  }

  advanceFromChallenge(): void {
    this.step1Challenge.close();
    this.goNext();
  }

  // ── step 2 challenge ──────────────────────────────────────────────────────────

  openPPChallenge(): void {
    this.ppChallengeSQL.set(PP_STARTING_SQL);
    this.step2Challenge.open();
    this.setupPPDatabase().catch(() => {});
  }

  closePPChallenge(): void {
    this.step2Challenge.close();
    this.ppChallengeTrigger?.nativeElement.focus();
  }

  onPPChallengeInput(event: Event): void {
    this.ppChallengeSQL.set((event.target as HTMLTextAreaElement).value);
  }

  async submitPPChallenge(): Promise<void> {
    this.step2Challenge.checking.set(true);
    try {
      const sql = this.ppChallengeSQL();

      await this.setupPPDatabase();
      let rows: QueryResult['rows'];
      try {
        rows = (await query(sql)).rows;
      } catch {
        this.step2Challenge.state.set('wrong-sql');
        return;
      }

      const structure = checkPushdownStructure(sql);
      if (structure === 'both-in-having') {
        this.step2Challenge.state.set('wrong-both-having');
        return;
      }

      this.step2Challenge.state.set(matchesPPExpected(rows) ? 'correct' : 'wrong-output');
    } finally {
      this.step2Challenge.checking.set(false);
    }
  }

  revealPPSolution(): void {
    this.ppChallengeSQL.set(PP_SOLUTION_SQL);
    this.step2Challenge.solutionRevealed.set(true);
    this.step2Challenge.state.set('correct');
  }

  advanceFromPPChallenge(): void {
    this.step2Challenge.close();
    this.goNext();
  }

  private async setupPPDatabase(): Promise<void> {
    if (this.ppDbReady) return;
    await execute('CREATE OR REPLACE TABLE dim_products (product_id INTEGER, product_name VARCHAR, category VARCHAR)');
    const productValues = dimProducts.map(p => `(${p.product_id}, '${p.product_name}', '${p.category}')`).join(', ');
    await execute(`INSERT INTO dim_products VALUES ${productValues}`);
    this.ppDbReady = true;
  }
}

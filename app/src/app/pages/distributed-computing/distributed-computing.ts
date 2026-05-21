import { Component, ElementRef, ViewChild, computed, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { parse, Statement } from 'pgsql-ast-parser';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDatabase, faStar } from '@fortawesome/free-solid-svg-icons';
import { checkPruningStructure, checkPushdownStructure, checkCapstoneStructure } from './challenge-validators';
import { WorkshopStep, WorkshopStepConfig, FeedbackMap } from './workshop-step';
import { ChallengeController } from '../../labs/challenge-controller';
import { execute, QueryResult } from '../../labs/db/duckdb';
import { runQuery, matchesExpected } from '../../labs/validation';
import { dimProducts, dimCustomers, fctOrdersBatch1, fctOrderItems } from '../../labs/data/seed';
import { DIM_CUSTOMERS, FCT_ORDERS, FCT_ORDER_ITEMS } from '../../labs/data/schema';
import { SchemaPanel } from '../../labs/components/schema-panel/schema-panel';
import {
  CP_STARTING_SQL,
  CP_SOLUTION_SQL,
  PP_STARTING_SQL,
  PP_SOLUTION_SQL,
  CAPSTONE_STARTING_SQL,
  CAPSTONE_SOLUTION_SQL,
  CP_EXPECTED_ROWS,
  PP_EXPECTED_ROWS,
  CAPSTONE_EXPECTED_ROWS,
  CONCEPT_NAMES,
} from './distributed-computing.data';

// ── state types ───────────────────────────────────────────────────────────────

type ChallengeState = 'unanswered' | 'unsafe-sql' | 'wrong-sql' | 'wrong-output' | 'not-optimized' | 'correct';

// ── validation pipeline ───────────────────────────────────────────────────────

function makeValidator(
  sql: Signal<string>,
  controller: ChallengeController<ChallengeState>,
  checkStructure: (stmts: Statement[]) => 'not-optimized' | 'correct',
  expectedRows: Record<string, unknown>[],
  queryResult: WritableSignal<QueryResult | null>,
  queryError: WritableSignal<string | null>,
): () => Promise<void> {
  return async () => {
    const s = sql();
    queryResult.set(null);
    queryError.set(null);
    let stmts: Statement[] | undefined;
    try {
      const parsed = parse(s);
      if (!parsed.length || !parsed.every((st) => st.type === 'select' || st.type === 'with')) {
        controller.state.set('unsafe-sql');
        return;
      }
      stmts = parsed;
    } catch {
      /* malformed SQL — runQuery will surface the error */
    }
    const { data: result, error } = await runQuery(s);
    if (!result) {
      queryError.set(error);
      controller.state.set('wrong-sql');
      return;
    }
    queryResult.set(result);
    if (!matchesExpected(result.rows, expectedRows)) {
      controller.state.set('wrong-output');
      return;
    }
    controller.state.set(stmts ? checkStructure(stmts) : 'correct');
  };
}

// ── component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-distributed-computing',
  imports: [WorkshopStep, FaIconComponent, SchemaPanel],
  templateUrl: './distributed-computing.html',
  styleUrl: './distributed-computing.scss',
})
export class DistributedComputing implements OnInit {
  @ViewChild('stepShell') private readonly stepShellRef!: ElementRef<HTMLElement>;

  readonly schemaOpen = signal(false);
  readonly dbIcon = faDatabase;
  readonly starIcon = faStar;

  readonly step = signal<1 | 2 | 3>(1);
  readonly totalSteps = 3;
  readonly labCategory = 'Distributed computing';
  readonly labTitle = 'Minimizing data movement';

  readonly conceptName = computed(() => CONCEPT_NAMES[this.step() - 1]);
  readonly stepCleared = computed(() => {
    if (this.step() === 1) return this.step1Challenge.state() === 'correct';
    if (this.step() === 2) return this.step2Challenge.state() === 'correct';
    return false;
  });

  private readonly step1Challenge = new ChallengeController<ChallengeState>('unanswered');
  private readonly step2Challenge = new ChallengeController<ChallengeState>('unanswered');
  private readonly step3Challenge = new ChallengeController<ChallengeState>('unanswered');

  private readonly cpChallengeSQL = signal(CP_STARTING_SQL);
  private readonly ppChallengeSQL = signal(PP_STARTING_SQL);
  private readonly capstoneChallengeSQL = signal(CAPSTONE_STARTING_SQL);

  private readonly step1QueryResult = signal<QueryResult | null>(null);
  private readonly step2QueryResult = signal<QueryResult | null>(null);
  private readonly step3QueryResult = signal<QueryResult | null>(null);

  private readonly step1QueryError = signal<string | null>(null);
  private readonly step2QueryError = signal<string | null>(null);
  private readonly step3QueryError = signal<string | null>(null);

  private dbReady = false;

  readonly stepConfigs: WorkshopStepConfig[] = [
    {
      vizScenario: 'column-pruning',
      isFinalStep: false,
      paragraphs: [
        `We need two columns from <code>${DIM_CUSTOMERS}</code> to retrieve the top 5 Spanish customers:
        <code>customer_id</code> to join on, <code>customer_name</code> for the output.
        The table also stores <code>created_at</code> and <code>updated_at</code>, neither of which this query uses.
        <code>country</code> is used for filtering, but is not required in the projection.`,
        `<code>SELECT *</code> scans the full width of the table, while <code>SELECT customer_id, customer_name</code>
        only projects the needed columns. OLAP engines may push this projection down automatically,
        but not always. When a query is slow and you pull up the execution plan, column pruning is one of the
        first things to check.`,
      ],
      controller: this.step1Challenge,
      sql: this.cpChallengeSQL,
      queryResult: this.step1QueryResult,
      queryError: this.step1QueryError,
      startingSql: CP_STARTING_SQL,
      solutionSql: CP_SOLUTION_SQL,
      intro: 'Use column pruning to optimize the query below.',
      feedback: {
        'not-optimized':
          'Not quite. Trace what <code>category_revenue</code> needs from <code>products</code> and only project those columns.',
        correct:
          'Right. <code>product_id</code> for the join, <code>category</code> for the group-by, <code>unit_price</code> for the aggregation.',
        revealed:
          'The answer is <code>product_id</code> for the join, <code>category</code> for the group-by, <code>unit_price</code> for the aggregation. Everything else in <code>dim_products</code> is unnecessary.',
      } satisfies FeedbackMap,
      validate: makeValidator(
        this.cpChallengeSQL,
        this.step1Challenge,
        checkPruningStructure,
        CP_EXPECTED_ROWS,
        this.step1QueryResult,
        this.step1QueryError,
      ),
    },
    {
      vizScenario: 'predicate-pushdown',
      isFinalStep: false,
      paragraphs: [
        `We only need Spanish customers to compute the top 5. We can either apply <code>WHERE country = 'Spain'</code> after joining <code>${DIM_CUSTOMERS}</code> with <code>${FCT_ORDERS}</code>, scanning every customer row, or push the predicate early in the query so only matching rows enter the join.`,
        'Query optimisers detect this kind of pushdown and apply it automatically when the query is simple and statistics are fresh. Filtering on country early in the query makes the intent explicit, and keeps it efficient when the optimiser guesses wrong.',
      ],
      controller: this.step2Challenge,
      sql: this.ppChallengeSQL,
      queryResult: this.step2QueryResult,
      queryError: this.step2QueryError,
      startingSql: PP_STARTING_SQL,
      solutionSql: PP_SOLUTION_SQL,
      intro: 'Use predicate pushdown to optimize the query below.',
      feedback: {
        'not-optimized':
          "Both predicates are in <code>HAVING</code>, which runs after <code>GROUP BY</code>. One of them doesn't depend on any aggregated value — which one can be evaluated before the rows are grouped?",
        correct:
          "Right. <code>category != 'Food'</code> belongs in <code>WHERE</code> — it filters rows before aggregation. <code>COUNT(*) >= 2</code> stays in <code>HAVING</code> — it needs the grouped result.",
        revealed:
          "The <code>category</code> filter belongs in <code>WHERE</code>: it doesn't depend on aggregated values and evaluating it before <code>GROUP BY</code> reduces the rows that enter the aggregation. <code>COUNT(*) >= 2</code> is a post-aggregation predicate — it can't move.",
      } satisfies FeedbackMap,
      validate: makeValidator(
        this.ppChallengeSQL,
        this.step2Challenge,
        checkPushdownStructure,
        PP_EXPECTED_ROWS,
        this.step2QueryResult,
        this.step2QueryError,
      ),
    },
    {
      vizScenario: 'dag-race',
      isFinalStep: true,
      paragraphs: [
        'Both column pruning and predicate pushdown minimize data scanning. They can also make shuffles more manageable by reducing the data that enters a join or an aggregation.',
        'The principle generalizes: distributed computing optimization is about minimizing data movement. In practice this is achieved via scan, shuffle and pass minimization: use as little data as possible, avoid moving it across nodes — but if you must, do it as late as possible — and always try to compute as much as possible in one go.',
      ],
      controller: this.step3Challenge,
      sql: this.capstoneChallengeSQL,
      queryResult: this.step3QueryResult,
      queryError: this.step3QueryError,
      startingSql: CAPSTONE_STARTING_SQL,
      solutionSql: CAPSTONE_SOLUTION_SQL,
      intro:
        'Write a query that minimizes data movement and returns the top 5 Spanish customers by total items ordered.',
      feedback: {
        'not-optimized':
          'Think about minimizing data movement. Which table can be filtered and pruned first, before the joins?',
        correct: `Right. Filter and prune <code>${DIM_CUSTOMERS}</code> first, join the fact tables after, group last. Each step carries only the rows the next step actually needs.`,
        revealed: `<code>WHERE country = 'Spain'</code> and <code>SELECT customer_id, customer_name</code> go inside the first CTE. That gives the engine a small set to join against <code>${FCT_ORDERS}</code>, which then feeds <code>${FCT_ORDER_ITEMS}</code>. <code>GROUP BY</code> runs last on the already-reduced data.`,
      } satisfies FeedbackMap,
      validate: makeValidator(
        this.capstoneChallengeSQL,
        this.step3Challenge,
        checkCapstoneStructure,
        CAPSTONE_EXPECTED_ROWS,
        this.step3QueryResult,
        this.step3QueryError,
      ),
    },
  ];

  readonly currentStepConfig = computed<WorkshopStepConfig>(() => this.stepConfigs[this.step() - 1]);

  goNext(): void {
    this.step.set((this.step() + 1) as 2 | 3);
    setTimeout(() => this.stepShellRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  goBack(): void {
    this.step.set((this.step() - 1) as 1 | 2);
    setTimeout(() => this.stepShellRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  onStepAdvance(): void {
    if (this.step() < this.totalSteps) this.goNext();
  }

  onScrollToStep(): void {
    setTimeout(() => this.stepShellRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  ngOnInit(): void {
    this.setupDatabase().catch(() => {});
  }

  private async setupDatabase(): Promise<void> {
    if (this.dbReady) return;
    await execute(
      'CREATE OR REPLACE TABLE dim_products (product_id INTEGER, product_name VARCHAR, category VARCHAR, unit_price INTEGER, created_at VARCHAR, updated_at VARCHAR)',
    );
    await execute(
      `INSERT INTO dim_products VALUES ${dimProducts.map((p) => `(${p.product_id}, '${p.product_name}', '${p.category}', ${p.unit_price}, '${p.created_at}', '${p.updated_at}')`).join(', ')}`,
    );
    await execute(
      'CREATE OR REPLACE TABLE fct_order_items (order_id INTEGER, product_id INTEGER, quantity INTEGER, created_at VARCHAR, updated_at VARCHAR)',
    );
    await execute(
      `INSERT INTO fct_order_items VALUES ${fctOrderItems.map((i) => `(${i.order_id}, ${i.product_id}, ${i.quantity}, '${i.created_at}', '${i.updated_at}')`).join(', ')}`,
    );
    await execute(
      'CREATE OR REPLACE TABLE dim_customers (customer_id INTEGER, customer_name VARCHAR, country VARCHAR, created_at VARCHAR, updated_at VARCHAR)',
    );
    await execute(
      `INSERT INTO dim_customers VALUES ${dimCustomers.map((c) => `(${c.customer_id}, '${c.customer_name}', '${c.country}', '${c.created_at}', '${c.updated_at}')`).join(', ')}`,
    );
    await execute(
      'CREATE OR REPLACE TABLE fct_orders (order_id INTEGER, customer_id INTEGER, amount INTEGER, order_date VARCHAR, created_at VARCHAR, updated_at VARCHAR)',
    );
    await execute(
      `INSERT INTO fct_orders VALUES ${fctOrdersBatch1.map((o) => `(${o.order_id}, ${o.customer_id}, ${o.amount}, '${o.order_date}', '${o.created_at}', '${o.updated_at}')`).join(', ')}`,
    );
    this.dbReady = true;
  }
}

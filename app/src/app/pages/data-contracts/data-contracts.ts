import { Component, computed, ElementRef, inject, OnInit, signal } from '@angular/core';
import Ajv, { ErrorObject } from 'ajv';
import { SqlEditor } from '../../labs/components/sql-editor/sql-editor';
import { BarChart } from '../../labs/components/bar-chart/bar-chart';
import { getDB, query } from '../../labs/db/duckdb';
import { dimCustomers, fctOrdersBatch1, fctOrdersBatch2, FctOrder } from '../../labs/data/seed';
import { ChartRow } from '../../labs/components/chart-colors';

// ── schemas ──────────────────────────────────────────────────────────────────

const FCT_ORDERS_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'fct_orders row',
  type: 'object',
  required: ['order_id', 'customer_id', 'amount', 'order_date'],
  properties: {
    order_id:    { type: 'integer' },
    customer_id: { type: 'integer' },
    amount:      { type: 'integer' },
    order_date:  { type: 'string' },
  },
  additionalProperties: false,
};

const OUTPUT_SCHEMA = {
  type: 'object',
  required: ['customer_name', 'avg_order_amount'],
  properties: {
    customer_name:    { type: 'string' },
    avg_order_amount: { type: 'number' },
  },
};

const ajv = new Ajv({ allErrors: false });
const validateInput  = ajv.compile(FCT_ORDERS_SCHEMA);
const validateOutput = ajv.compile(OUTPUT_SCHEMA);

function firstInputViolation(rows: FctOrder[]): { row: FctOrder; error: ErrorObject } | null {
  for (const row of rows) {
    if (!validateInput(row)) {
      return { row, error: (validateInput.errors as ErrorObject[])[0] };
    }
  }
  return null;
}

// ── editor content ────────────────────────────────────────────────────────────

const SOLUTION = `WITH avg_amounts AS (
  SELECT
    c.customer_name,
    AVG(o.amount) AS avg_order_amount
  FROM fct_orders o
  JOIN dim_customers c ON o.customer_id = c.customer_id
  WHERE EXTRACT(YEAR FROM o.order_date::DATE) = 2026
  GROUP BY c.customer_name
)
SELECT customer_name, avg_order_amount
FROM avg_amounts
ORDER BY avg_order_amount DESC
LIMIT 5;`;

const SKELETON = `-- Compute average order amount per customer name for 2026
-- Tables: fct_orders (order_id, customer_id, amount, order_date)
--         dim_customers (customer_id, customer_name)
-- Return: customer_name, avg_order_amount — top 5 DESC

`;

// ── types ─────────────────────────────────────────────────────────────────────

interface ContractViolation {
  field: string;
  constraint: string;
  received: string;
}

// ── component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-data-contracts',
  imports: [SqlEditor, BarChart],
  templateUrl: './data-contracts.html',
  styleUrl: './data-contracts.scss',
})
export class DataContracts implements OnInit {
  readonly solution = SOLUTION;
  readonly skeleton = SKELETON;
  readonly schemaDisplay = JSON.stringify(FCT_ORDERS_SCHEMA, null, 2);
  readonly loadingText = 'Loading DuckDB...';
  readonly runStep2Label = 'Run';
  readonly nextLabel = 'Next';
  readonly totalSteps = 3;

  readonly step1Intro = 'There is a pipeline that runs every night. It pulls raw orders from a source database, loads them into a Kimball model, then runs a mart job that feeds a dashboard. Someone senior watches that dashboard. Wrong numbers erode trust quickly.';
  readonly step1Task = 'You are writing the mart job. Write a CTE that computes the average order amount per customer name for 2026 and returns the top 5.';
  readonly step2Intro = 'The pipeline ran again overnight. The upstream team pushed new data. Run your query on the refreshed table and see what comes back.';
  readonly step3Prose = [
    'The query did not throw. DuckDB returned rows and the chart rendered. But look at who is in the top 5.',
    'The upstream team made <code>amount</code> nullable. A batch came through with no amounts for the top customers — DuckDB\'s <code>AVG</code> silently ignored them, and they dropped out of the ranking entirely.',
    'A stakeholder looking at that dashboard would see their top customers disappear overnight.',
    'A contract on <code>fct_orders</code> would have caught this at ingestion, before the mart job ran and faulty data reached the dashboard.',
    'A data contract is a formal agreement between producer and consumer. At minimum, the producing team declares field types, nullability, and constraints; the consuming team validates incoming data against that declaration at the boundary. A batch that violates the contract fails there instead of propagating silently downstream.',
    'Several formats can express a contract; this lab uses JSON Schema:',
  ];
  readonly step3MetaReveal = 'One more thing: this lab validated your query output against a contract before rendering the chart in step 1. That is why a query with wrong column names or types returned a hint instead of a broken chart. The same principle, applied one step earlier in the pipeline.';
  readonly violationBlockTitle = 'What the contract would have thrown at ingestion';

  private readonly elRef = inject(ElementRef);

  readonly dbReady       = signal(false);
  readonly step          = signal<1 | 2 | 3>(1);
  readonly step1Done     = signal(false);
  readonly step2Done     = signal(false);
  readonly step1Rows     = signal<ChartRow[]>([]);
  readonly step2Rows     = signal<ChartRow[]>([]);
  readonly lastSql       = signal<string>('');
  readonly sqlError      = signal<string | null>(null);
  readonly outputHint    = signal<string | null>(null);
  readonly inputViolation = signal<ContractViolation | null>(null);

  readonly violationDetail = computed(() => {
    const v = this.inputViolation();
    if (!v) return '';
    return `Field <code>${v.field}</code> — ${v.constraint}, received ${v.received}`;
  });

  async ngOnInit() {
    await this.seedBatch(1);
    this.dbReady.set(true);
  }

  private async seedBatch(n: 1 | 2) {
    const db     = await getDB();
    const conn   = await db.connect();
    const orders = n === 1 ? fctOrdersBatch1 : fctOrdersBatch2;
    try {
      await conn.query(`DROP TABLE IF EXISTS fct_orders`);
      await conn.query(`DROP TABLE IF EXISTS dim_customers`);
      await conn.query(`CREATE TABLE dim_customers (customer_id INTEGER, customer_name VARCHAR)`);
      await conn.query(`CREATE TABLE fct_orders (order_id INTEGER, customer_id INTEGER, amount INTEGER, order_date VARCHAR)`);

      const customerVals = dimCustomers
        .map(c => `(${c.customer_id}, '${c.customer_name.replace("'", "''")}')`).join(',');
      await conn.query(`INSERT INTO dim_customers VALUES ${customerVals}`);

      const orderVals = orders
        .map(o => `(${o.order_id}, ${o.customer_id}, ${o.amount === null ? 'NULL' : o.amount}, '${o.order_date}')`).join(',');
      await conn.query(`INSERT INTO fct_orders VALUES ${orderVals}`);
    } finally {
      await conn.close();
    }
  }

  // ── step 1 ──────────────────────────────────────────────────────────────────

  async onRunStep1(sql: string) {
    this.sqlError.set(null);
    this.outputHint.set(null);

    const trimmed = sql.replace(/--[^\n]*/g, '').trim();
    if (!trimmed) {
      this.outputHint.set('Write a query first.');
      return;
    }

    this.lastSql.set(sql);

    try {
      const result = await query(sql);
      const invalid = result.rows.find(r => !validateOutput(r));
      if (invalid) {
        this.outputHint.set(
          'Your query ran but the output does not match what the chart expects. ' +
          'Make sure you return customer_name (text) and avg_order_amount (number).'
        );
        return;
      }
      const rows: ChartRow[] = result.rows.map(r => ({
        label: r['customer_name'] as string,
        value: r['avg_order_amount'] as number,
      }));
      this.step1Rows.set(rows);
      if (rows.length > 0) {
        this.step1Done.set(true);
        setTimeout(() => (this.elRef.nativeElement as HTMLElement).querySelector('.chart-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      }
    } catch (e) {
      this.sqlError.set((e as Error).message);
    }
  }

  // ── step 2 ──────────────────────────────────────────────────────────────────

  async onRunStep2() {
    this.sqlError.set(null);
    try {
      await this.seedBatch(2);
      const result = await query(this.lastSql());
      const rows: ChartRow[] = result.rows.map(r => ({
        label: r['customer_name'] as string,
        value: r['avg_order_amount'] as number | null,
      }));
      this.step2Rows.set(rows);
      this.step2Done.set(true);
      setTimeout(() => (this.elRef.nativeElement as HTMLElement).querySelector('.chart-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
    } catch (e) {
      this.sqlError.set((e as Error).message);
    }
  }

  // ── step 3 ──────────────────────────────────────────────────────────────────

  onEnterStep3() {
    const v = firstInputViolation(fctOrdersBatch2);
    if (v) {
      const field = v.error.instancePath.replace('/', '') ||
                    (v.error.params as Record<string, string>)['missingProperty'];
      const received = (v.row as unknown as Record<string, unknown>)[field];
      this.inputViolation.set({
        field,
        constraint: `type must be ${(v.error.params as Record<string, string>)['type']}`,
        received:   received === null ? 'null' : String(received),
      });
    }
  }

  // ── navigation ───────────────────────────────────────────────────────────────

  goNext() {
    const next = (this.step() + 1) as 2 | 3;
    if (next === 3) this.onEnterStep3();
    this.step.set(next);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  async goBack() {
    const prev = (this.step() - 1) as 1 | 2;
    if (prev === 1) await this.seedBatch(1);
    this.step.set(prev);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  canGoNext(): boolean {
    if (this.step() === 1) return this.step1Done();
    if (this.step() === 2) return this.step2Done();
    return false;
  }
}

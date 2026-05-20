import { Component, ElementRef, ViewChild, computed, inject, OnInit, signal } from '@angular/core';
import Ajv, { ErrorObject } from 'ajv';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDatabase, faStar } from '@fortawesome/free-solid-svg-icons';
import { SqlEditor } from '../../labs/components/sql-editor/sql-editor';
import { BarChart } from '../../labs/components/bar-chart/bar-chart';
import { SchemaPanel } from '../../labs/components/schema-panel/schema-panel';
import { getDB, query } from '../../labs/db/duckdb';
import { dimCustomers, fctOrdersBatch1, fctOrdersBatch2, FctOrder } from '../../labs/data/seed';
import { ChartRow } from '../../labs/components/chart-colors';
import { runQuery, matchesExpected } from '../../labs/validation';
import {
  DC_SKELETON,
  DC_SOLUTION,
  DC_STEP1_EXPECTED_ROWS,
  DC_STEP1_INTRO,
  DC_STEP1_TASK,
  DC_STEP2_INTRO,
  DC_STEP3_PROSE,
  DC_STEP3_META_REVEAL,
  DC_VIOLATION_BLOCK_TITLE,
  DC_LOADING_TEXT,
  DC_RUN_STEP2_LABEL,
  DC_NEXT_LABEL,
  DC_TOTAL_STEPS,
} from './data-contracts.data';

// ── schemas ──────────────────────────────────────────────────────────────────

const FCT_ORDERS_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'fct_orders row',
  type: 'object',
  required: ['order_id', 'customer_id', 'amount', 'order_date'],
  properties: {
    order_id: { type: 'integer' },
    customer_id: { type: 'integer' },
    amount: { type: 'integer' },
    order_date: { type: 'string' },
  },
  additionalProperties: false,
};

const OUTPUT_SCHEMA = {
  type: 'object',
  required: ['customer_name', 'total_amount'],
  properties: {
    customer_name: { type: 'string' },
    total_amount: { type: 'number' },
  },
};

const ajv = new Ajv({ allErrors: false });
const validateInput = ajv.compile(FCT_ORDERS_SCHEMA);
const validateOutput = ajv.compile(OUTPUT_SCHEMA);

function firstInputViolation(rows: FctOrder[]): { row: FctOrder; error: ErrorObject } | null {
  for (const row of rows) {
    if (!validateInput(row)) {
      return { row, error: (validateInput.errors as ErrorObject[])[0] };
    }
  }
  return null;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface ContractViolation {
  field: string;
  constraint: string;
  received: string;
}

// ── component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-data-contracts',
  imports: [SqlEditor, BarChart, FaIconComponent, SchemaPanel],
  templateUrl: './data-contracts.html',
  styleUrl: './data-contracts.scss',
})
export class DataContracts implements OnInit {
  @ViewChild('stepShell') private readonly stepShellRef?: ElementRef<HTMLElement>;

  readonly schemaOpen = signal(false);
  readonly dbIcon = faDatabase;
  readonly starIcon = faStar;

  readonly solution = DC_SOLUTION;
  readonly skeleton = DC_SKELETON;
  readonly schemaDisplay = JSON.stringify(FCT_ORDERS_SCHEMA, null, 2);
  readonly loadingText = DC_LOADING_TEXT;
  readonly runStep2Label = DC_RUN_STEP2_LABEL;
  readonly nextLabel = DC_NEXT_LABEL;
  readonly totalSteps = DC_TOTAL_STEPS;
  readonly step1Intro = DC_STEP1_INTRO;
  readonly step1Task = DC_STEP1_TASK;
  readonly step2Intro = DC_STEP2_INTRO;
  readonly step3Prose = DC_STEP3_PROSE;
  readonly step3MetaReveal = DC_STEP3_META_REVEAL;
  readonly violationBlockTitle = DC_VIOLATION_BLOCK_TITLE;

  private readonly elRef = inject(ElementRef);

  readonly dbReady = signal(false);
  readonly step = signal<1 | 2 | 3>(1);
  readonly step1Done = signal(false);
  readonly step2Done = signal(false);
  readonly step1Rows = signal<ChartRow[]>([]);
  readonly step2Rows = signal<ChartRow[]>([]);
  readonly lastSql = signal<string>('');
  readonly sqlError = signal<string | null>(null);
  readonly outputHint = signal<string | null>(null);
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
    const db = await getDB();
    const conn = await db.connect();
    const orders = n === 1 ? fctOrdersBatch1 : fctOrdersBatch2;
    try {
      await conn.query(`DROP TABLE IF EXISTS fct_orders`);
      await conn.query(`DROP TABLE IF EXISTS dim_customers`);
      await conn.query(`CREATE TABLE dim_customers (customer_id INTEGER, customer_name VARCHAR, country VARCHAR)`);
      await conn.query(
        `CREATE TABLE fct_orders (order_id INTEGER, customer_id INTEGER, amount INTEGER, order_date VARCHAR)`,
      );

      const customerVals = dimCustomers
        .map((c) => `(${c.customer_id}, '${c.customer_name.replace("'", "''")}', '${c.country}')`)
        .join(',');
      await conn.query(`INSERT INTO dim_customers VALUES ${customerVals}`);

      const orderVals = orders
        .map((o) => `(${o.order_id}, ${o.customer_id}, ${o.amount === null ? 'NULL' : o.amount}, '${o.order_date}')`)
        .join(',');
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

    const { data, error } = await runQuery(sql);
    if (!data) {
      this.sqlError.set(error);
      return;
    }

    const { rows } = data;
    const invalid = rows.find((r) => !validateOutput(r));
    if (invalid) {
      this.outputHint.set(
        'Your query ran but the output does not match what the chart expects. ' +
          'Make sure you return customer_name (text) and total_amount (number).',
      );
      return;
    }

    if (!matchesExpected(rows, DC_STEP1_EXPECTED_ROWS)) {
      this.outputHint.set(
        'Close — check your filter or aggregation. The column structure is right but the values differ.',
      );
      return;
    }

    const chartRows: ChartRow[] = rows.map((r) => ({
      label: r['customer_name'] as string,
      value: r['total_amount'] as number,
    }));
    this.step1Rows.set(chartRows);
    this.step1Done.set(true);
    setTimeout(
      () =>
        (this.elRef.nativeElement as HTMLElement)
          .querySelector('.chart-wrap')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      0,
    );
  }

  // ── step 2 ──────────────────────────────────────────────────────────────────

  async onRunStep2() {
    this.sqlError.set(null);
    try {
      await this.seedBatch(2);
      const result = await query(this.lastSql());
      const rows: ChartRow[] = result.rows.map((r) => ({
        label: r['customer_name'] as string,
        value: r['total_amount'] as number | null,
      }));
      this.step2Rows.set(rows);
      this.step2Done.set(true);
      setTimeout(
        () =>
          (this.elRef.nativeElement as HTMLElement)
            .querySelector('.chart-wrap')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        0,
      );
    } catch (e) {
      this.sqlError.set((e as Error).message);
    }
  }

  // ── step 3 ──────────────────────────────────────────────────────────────────

  onEnterStep3() {
    const v = firstInputViolation(fctOrdersBatch2);
    if (v) {
      const field =
        v.error.instancePath.replace('/', '') || (v.error.params as Record<string, string>)['missingProperty'];
      const received = (v.row as unknown as Record<string, unknown>)[field];
      this.inputViolation.set({
        field,
        constraint: `type must be ${(v.error.params as Record<string, string>)['type']}`,
        received: received === null ? 'null' : String(received),
      });
    }
  }

  // ── navigation ───────────────────────────────────────────────────────────────

  goNext() {
    const next = (this.step() + 1) as 2 | 3;
    if (next === 3) this.onEnterStep3();
    this.step.set(next);
    setTimeout(() => this.stepShellRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  async goBack() {
    const prev = (this.step() - 1) as 1 | 2;
    if (prev === 1) await this.seedBatch(1);
    this.step.set(prev);
    setTimeout(() => this.stepShellRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  readonly canGoNext = computed(() => {
    if (this.step() === 1) return this.step1Done();
    if (this.step() === 2) return this.step2Done();
    return false;
  });
}

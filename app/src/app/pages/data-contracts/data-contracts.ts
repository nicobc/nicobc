import { Component, ElementRef, ViewChild, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import Ajv, { ErrorObject } from 'ajv';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDatabase, faStar } from '@fortawesome/free-solid-svg-icons';
import { SqlEditor } from '../../labs/components/sql-editor/sql-editor';
import { BarChart } from '../../labs/components/bar-chart/bar-chart';
import { SchemaPanel } from '../../labs/components/schema-panel/schema-panel';
import { StepNav } from '../../labs/components/step-nav/step-nav';
import { DbIcon } from '../../labs/components/db-icon/db-icon';
import { SubstepProgression, Substeps } from '../../labs/components/substep-progression/substep-progression';
import { getDB, query } from '../../labs/db/duckdb';
import { dimCustomers, fctOrdersBatch1, fctOrdersBatch2, FctOrder } from '../../labs/data/seed';
import { DIM_CUSTOMERS, FCT_ORDERS } from '../../labs/data/schema';
import { ChartRow } from '../../labs/components/chart-colors';
import { runQuery, matchesExpected } from '../../labs/validation';
import {
  DagNode,
  DC_DAG_NODES,
  DC_SKELETON,
  DC_SOLUTION,
  DC_STEP1_EXPECTED_ROWS,
  DC_STEP1_INTRO,
  DC_STEP1_TASK,
  DC_STEP2_INTRO,
  DC_STEP3_SILENT_FAILURE_PROSE,
  DC_STEP3_CONTRACT_PROSE,
  DC_STEP3_META_REVEAL,
  DC_VIOLATION_BLOCK_TITLE,
  DC_LOADING_TEXT,
  DC_RUN_STEP2_LABEL,
  DC_TOTAL_STEPS,
  DC_CHART_PRIMARY_LABEL,
  DC_CHART_COMPARISON_LABEL,
} from './data-contracts.data';

// ── schemas ──────────────────────────────────────────────────────────────────

const FCT_ORDERS_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: `${FCT_ORDERS} row`,
  type: 'object',
  required: ['order_id', 'customer_id', 'amount', 'order_date'],
  properties: {
    order_id: { type: 'integer' },
    customer_id: { type: 'integer' },
    amount: { type: 'integer' },
    order_date: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
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
  additionalProperties: false,
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
  imports: [SqlEditor, BarChart, FaIconComponent, SchemaPanel, StepNav, DbIcon, SubstepProgression],
  templateUrl: './data-contracts.html',
  styleUrl: './data-contracts.scss',
})
export class DataContracts implements OnInit {
  @ViewChild('stepShell') private readonly stepShellRef?: ElementRef<HTMLElement>;

  private readonly elRef = inject(ElementRef);
  private readonly router = inject(Router);

  readonly schemaOpen = signal(false);
  readonly dbIcon = faDatabase;
  readonly starIcon = faStar;

  readonly labCategory = 'Data contracts';
  readonly labTitle = 'Catching schema drift';
  readonly dagNodes: readonly DagNode[] = DC_DAG_NODES;
  readonly chartPrimaryLabel = DC_CHART_PRIMARY_LABEL;
  readonly chartComparisonLabel = DC_CHART_COMPARISON_LABEL;
  readonly solution = DC_SOLUTION;
  readonly skeleton = DC_SKELETON;
  readonly schemaDisplay = JSON.stringify(FCT_ORDERS_SCHEMA, null, 2);
  readonly loadingText = DC_LOADING_TEXT;
  readonly runStep2Label = DC_RUN_STEP2_LABEL;
  readonly totalSteps = DC_TOTAL_STEPS;
  readonly step1Intro = DC_STEP1_INTRO;
  readonly step1Task = DC_STEP1_TASK;
  readonly step2Intro = DC_STEP2_INTRO;
  readonly step3SilentFailureProse = DC_STEP3_SILENT_FAILURE_PROSE;
  readonly step3ContractProse = DC_STEP3_CONTRACT_PROSE;
  readonly step3MetaReveal = DC_STEP3_META_REVEAL;
  readonly violationBlockTitle = DC_VIOLATION_BLOCK_TITLE;

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

  readonly step1Substeps: Substeps = [{ kind: 'free' }, { kind: 'gated', done: this.step1Done }];
  readonly step2Substeps: Substeps = [{ kind: 'gated', done: this.step2Done }];
  readonly step3Substeps: Substeps = [{ kind: 'free' }, { kind: 'free' }, { kind: 'free' }];

  readonly canGoNext = computed(() => {
    if (this.step() === 1) return this.step1Done();
    if (this.step() === 2) return this.step2Done();
    return false;
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
      await conn.query(`DROP TABLE IF EXISTS ${FCT_ORDERS}`);
      await conn.query(`DROP TABLE IF EXISTS ${DIM_CUSTOMERS}`);
      await conn.query(`CREATE TABLE ${DIM_CUSTOMERS} (customer_id INTEGER, customer_name VARCHAR, country VARCHAR)`);
      await conn.query(
        `CREATE TABLE ${FCT_ORDERS} (order_id INTEGER, customer_id INTEGER, amount INTEGER, order_date VARCHAR)`,
      );

      const customerVals = dimCustomers
        .map((c) => `(${c.customer_id}, '${c.customer_name.replace("'", "''")}', '${c.country}')`)
        .join(',');
      await conn.query(`INSERT INTO ${DIM_CUSTOMERS} VALUES ${customerVals}`);

      const orderVals = orders
        .map((o) => `(${o.order_id}, ${o.customer_id}, ${o.amount === null ? 'NULL' : o.amount}, '${o.order_date}')`)
        .join(',');
      await conn.query(`INSERT INTO ${FCT_ORDERS} VALUES ${orderVals}`);
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
      this.outputHint.set('Query ran but the output structure does not match the expected schema.');
      return;
    }

    if (!matchesExpected(rows, DC_STEP1_EXPECTED_ROWS)) {
      this.outputHint.set("Close. The column structure is right but the values don't match the expected output.");
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

  private onEnterStep3() {
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

  async onDone(): Promise<void> {
    await this.router.navigate(['/lab/workshops']);
  }

  async goBack() {
    if (this.step() === 1) {
      await this.router.navigate(['/lab/workshops']);
      return;
    }
    const prev = (this.step() - 1) as 1 | 2;
    if (prev === 1) await this.seedBatch(1);
    this.step.set(prev);
    setTimeout(() => this.stepShellRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
}

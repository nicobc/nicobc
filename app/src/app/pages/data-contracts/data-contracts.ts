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
import { getDB, query, QueryResult } from '../../labs/db/duckdb';
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
  DC_STEP1_FEEDBACK_EMPTY,
  DC_STEP1_FEEDBACK_WRONG_STRUCTURE,
  DC_STEP1_FEEDBACK_WRONG_VALUES,
  DC_STEP1_FEEDBACK_CORRECT,
  DC_STEP2_INTRO,
  DC_STEP3_SILENT_FAILURE_PROSE,
  DC_STEP3_CONTRACT_PROSE,
  DC_STEP3_META_REVEAL,
  DC_CONCLUSION_COPY,
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

type Step1Feedback =
  | { kind: 'none' }
  | { kind: 'trace'; error: string }
  | { kind: 'message'; html: string }
  | { kind: 'correct'; html: string };

// ── component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-data-contracts',
  imports: [SqlEditor, BarChart, FaIconComponent, SchemaPanel, StepNav, DbIcon, SubstepProgression],
  templateUrl: './data-contracts.html',
  styleUrl: './data-contracts.scss',
})
export class DataContracts implements OnInit {
  @ViewChild('stepShell') private readonly stepShellRef?: ElementRef<HTMLElement>;
  @ViewChild(SqlEditor) private readonly step1EditorRef?: SqlEditor;

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
  readonly conclusionCopy = DC_CONCLUSION_COPY;
  readonly violationBlockTitle = DC_VIOLATION_BLOCK_TITLE;
  readonly runLabel = 'Run';
  readonly submitLabel = 'Submit';
  readonly submittingLabel = 'Submitting…';
  readonly revealLabel = 'Reveal';

  readonly dbReady = signal(false);
  readonly step = signal<1 | 2 | 3 | 4>(1);

  // ── step 1 state ────────────────────────────────────────────────────────────
  readonly step1Sql = signal(DC_SKELETON);
  readonly step1Feedback = signal<Step1Feedback>({ kind: 'none' });
  readonly step1Checking = signal(false);
  readonly step1QueryResult = signal<QueryResult | null>(null);
  readonly step1Rows = signal<ChartRow[]>([]);
  readonly step1Done = computed(() => this.step1Feedback().kind === 'correct');
  readonly step1CommittedSql = signal(DC_SKELETON);

  // ── step 2 state ────────────────────────────────────────────────────────────
  readonly step2Done = signal(false);
  readonly step2Rows = signal<ChartRow[]>([]);
  readonly step2Error = signal<string | null>(null);

  // ── step 3 state ────────────────────────────────────────────────────────────
  readonly inputViolation = signal<ContractViolation | null>(null);

  readonly violationDetail = computed(() => {
    const v = this.inputViolation();
    if (!v) return '';
    return `Field <code>${v.field}</code> — ${v.constraint}, received ${v.received}`;
  });

  readonly step1Substeps: Substeps = [{ kind: 'free' }, { kind: 'gated', done: this.step1Done }];
  readonly step2Substeps: Substeps = [{ kind: 'gated', done: this.step2Done }];
  readonly step3Substeps: Substeps = [{ kind: 'free' }, { kind: 'free' }, { kind: 'free' }, { kind: 'free' }];
  readonly step4Substeps: Substeps = [{ kind: 'free' }];

  readonly canGoNext = computed(() => {
    if (this.step() === 1) return this.step1Done();
    if (this.step() === 2) return this.step2Done();
    return false;
  });

  get step1FeedbackDisplay(): Step1Feedback {
    return this.step1Feedback();
  }

  get step1FeedbackClass(): string {
    return this.step1Feedback().kind === 'correct'
      ? 'feedback-block feedback-block--success'
      : 'feedback-block feedback-block--error';
  }

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

  onStep1Input(value: string): void {
    this.step1Sql.set(value);
  }

  async runStep1(): Promise<void> {
    const sql = this.step1Sql();
    const trimmed = sql.replace(/--[^\n]*/g, '').trim();
    if (!trimmed) {
      this.step1Feedback.set({ kind: 'message', html: DC_STEP1_FEEDBACK_EMPTY });
      return;
    }
    this.step1QueryResult.set(null);
    if (this.step1Feedback().kind !== 'correct') {
      this.step1Feedback.set({ kind: 'none' });
    }
    const { data, error } = await runQuery(sql);
    if (!data) {
      this.step1Feedback.set({ kind: 'trace', error: error ?? '' });
      return;
    }
    this.step1QueryResult.set(data);
  }

  async submitStep1(): Promise<void> {
    if (this.step1Checking()) return;
    const sql = this.step1Sql();
    const trimmed = sql.replace(/--[^\n]*/g, '').trim();
    if (!trimmed) {
      this.step1Feedback.set({ kind: 'message', html: DC_STEP1_FEEDBACK_EMPTY });
      return;
    }
    this.step1Checking.set(true);
    this.step1QueryResult.set(null);
    this.step1Feedback.set({ kind: 'none' });
    try {
      const { data, error } = await runQuery(sql);
      if (!data) {
        this.step1Feedback.set({ kind: 'trace', error: error ?? '' });
        return;
      }
      this.step1QueryResult.set(data);
      const { rows } = data;
      if (rows.find((r) => !validateOutput(r))) {
        this.step1Feedback.set({ kind: 'message', html: DC_STEP1_FEEDBACK_WRONG_STRUCTURE });
        return;
      }
      if (!matchesExpected(rows, DC_STEP1_EXPECTED_ROWS)) {
        this.step1Feedback.set({ kind: 'message', html: DC_STEP1_FEEDBACK_WRONG_VALUES });
        return;
      }
      this.step1CommittedSql.set(sql);
      this.step1Rows.set(
        rows.map((r) => ({ label: r['customer_name'] as string, value: r['total_amount'] as number })),
      );
      this.step1Feedback.set({ kind: 'correct', html: DC_STEP1_FEEDBACK_CORRECT });
      setTimeout(
        () =>
          (this.elRef.nativeElement as HTMLElement)
            .querySelector('.chart-wrap')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        0,
      );
    } finally {
      this.step1Checking.set(false);
    }
  }

  revealStep1(): void {
    this.step1Sql.set(DC_SOLUTION);
    this.step1EditorRef?.setValue(DC_SOLUTION);
  }

  restartStep1(): void {
    this.step1Sql.set(DC_SKELETON);
    this.step1EditorRef?.setValue(DC_SKELETON);
    this.step1QueryResult.set(null);
    this.step1Feedback.set({ kind: 'none' });
  }

  // ── step 2 ──────────────────────────────────────────────────────────────────

  async onRunStep2() {
    this.step2Error.set(null);
    try {
      await this.seedBatch(2);
      const result = await query(this.step1CommittedSql());
      this.step2Rows.set(
        result.rows.map((r) => ({ label: r['customer_name'] as string, value: r['total_amount'] as number | null })),
      );
      this.step2Done.set(true);
      setTimeout(
        () =>
          (this.elRef.nativeElement as HTMLElement)
            .querySelector('.chart-wrap')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        0,
      );
    } catch (e) {
      this.step2Error.set((e as Error).message);
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
    const next = (this.step() + 1) as 2 | 3 | 4;
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
    const prev = (this.step() - 1) as 1 | 2 | 3;
    if (prev === 1) await this.seedBatch(1);
    this.step.set(prev);
    setTimeout(() => this.stepShellRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }
}

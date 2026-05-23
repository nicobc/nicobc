import { DIM_CUSTOMERS, FCT_ORDERS } from '../../labs/data/schema';

// ── DAG ──────────────────────────────────────────────────────────────────────

export interface DagNode {
  tier?: 'Bronze' | 'Silver' | 'Gold';
  label: string;
  active?: true;
}

export const DC_DAG_NODES: DagNode[] = [
  { tier: 'Bronze', label: 'Orders backend' },
  { label: 'Ingestion' },
  { tier: 'Silver', label: 'DWH' },
  { label: 'Transformation', active: true },
  { tier: 'Gold', label: 'KPI mart' },
];

// ── SQL ───────────────────────────────────────────────────────────────────────

export const DC_SKELETON = `-- Write your query here
-- Return: customer_name, total_amount

`;

export const DC_SOLUTION = `WITH total_amounts AS (
  SELECT
    c.customer_name,
    SUM(o.amount) AS total_amount
  FROM ${FCT_ORDERS} o
  JOIN ${DIM_CUSTOMERS} c ON o.customer_id = c.customer_id
  WHERE c.country = 'Spain'
  GROUP BY c.customer_name
)
SELECT customer_name, total_amount
FROM total_amounts
ORDER BY total_amount DESC
LIMIT 5;`;

// ── validation fixture ────────────────────────────────────────────────────────

// Expected step 1 output — batch 1, Spain only, sum(amount) DESC LIMIT 5.
// Derived from fctOrdersBatch1 seed: 4 orders each for ids 1-5.
// Grupo Valera: 4100+4300+4050+4400=16850, Distribuciones Casas: 3400+3600+3450+3550=14000
// Comercial Ibérica: 2750+2900+2700+2850=11200, Almacenes del Sur: 2000+2200+2050+2150=8400
// Industrias Bernal: 1550+1650+1580+1620=6400
export const DC_STEP1_EXPECTED_ROWS: Record<string, unknown>[] = [
  { customer_name: 'Grupo Valera', total_amount: 16850 },
  { customer_name: 'Distribuciones Casas', total_amount: 14000 },
  { customer_name: 'Comercial Ibérica', total_amount: 11200 },
  { customer_name: 'Almacenes del Sur', total_amount: 8400 },
  { customer_name: 'Industrias Bernal', total_amount: 6400 },
];

// ── copy ──────────────────────────────────────────────────────────────────────

export const DC_STEP1_INTRO =
  "Every night a pipeline pulls raw order data from the company's orders backend into the warehouse, where a transformation job computes KPIs for leadership.";

export const DC_STEP1_TASK =
  'Write one of the queries this transformation job runs: total order amount per customer for Spain, top 5.';

export const DC_STEP2_INTRO =
  'A new batch of orders landed overnight. The upstream team pushed fresh data into the warehouse.';

export const DC_STEP3_SILENT_FAILURE_PROSE = [
  'The query ran without error and the chart rendered, but the top customers from yesterday are gone.',
  'The upstream team made <code>amount</code> nullable. When the new batch came through, several top customers had null amounts; the query engine returned NULL for those rows and they dropped out of the ranking entirely.',
  `Leadership checks this chart each morning and knows these customers by name. Grupo Valera, the company's largest account, has dropped out of the top five entirely, and there is nothing to flag that the data is wrong.`,
];

export const DC_STEP3_CONTRACT_PROSE = [
  `A data contract on <code>${FCT_ORDERS}</code> would have caught this at the start of the transformation job, before corrupted data reached the KPI layer. A data contract is a formal agreement between producer and consumer. At minimum, the producing team declares field types, nullability, and constraints; the consuming team validates incoming data against that declaration at the boundary.`,
  'Several formats can express a contract; this lab uses JSON Schema.',
];

export const DC_STEP3_META_REVEAL =
  'Step 1 also enforced an output contract between your query and the chart. The same pattern, one layer further.';

export const DC_VIOLATION_BLOCK_TITLE = 'What the contract would have thrown at ingestion';

export const DC_LOADING_TEXT = 'Loading DuckDB...';
export const DC_RUN_STEP2_LABEL = 'Run';
export const DC_NEXT_LABEL = 'Next';
export const DC_TOTAL_STEPS = 3;
export const DC_CHART_PRIMARY_LABEL = 'Yesterday';
export const DC_CHART_COMPARISON_LABEL = 'Today';

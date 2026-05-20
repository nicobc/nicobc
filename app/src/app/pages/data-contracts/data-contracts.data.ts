import { DIM_CUSTOMERS, FCT_ORDERS } from '../../labs/data/schema';

// ── SQL ───────────────────────────────────────────────────────────────────────

export const DC_SKELETON = `-- Compute average order amount per customer name for Spain
-- Tables: ${FCT_ORDERS} (order_id, customer_id, amount, order_date)
--         ${DIM_CUSTOMERS} (customer_id, customer_name, country)
-- Return: customer_name, avg_order_amount — top 5 DESC

`;

export const DC_SOLUTION = `WITH avg_amounts AS (
  SELECT
    c.customer_name,
    AVG(o.amount) AS avg_order_amount
  FROM ${FCT_ORDERS} o
  JOIN ${DIM_CUSTOMERS} c ON o.customer_id = c.customer_id
  WHERE c.country = 'Spain'
  GROUP BY c.customer_name
)
SELECT customer_name, avg_order_amount
FROM avg_amounts
ORDER BY avg_order_amount DESC
LIMIT 5;`;

// ── validation fixture ────────────────────────────────────────────────────────

// Expected step 1 output — batch 1, Spain only, avg(amount) DESC LIMIT 5.
// Derived from fctOrdersBatch1 seed: 4 orders each for ids 1-5.
export const DC_STEP1_EXPECTED_ROWS: Record<string, unknown>[] = [
  { customer_name: 'Grupo Valera', avg_order_amount: 4212.5 },
  { customer_name: 'Distribuciones Casas', avg_order_amount: 3500 },
  { customer_name: 'Comercial Ibérica', avg_order_amount: 2800 },
  { customer_name: 'Almacenes del Sur', avg_order_amount: 2100 },
  { customer_name: 'Industrias Bernal', avg_order_amount: 1600 },
];

// ── copy ──────────────────────────────────────────────────────────────────────

export const DC_STEP1_INTRO =
  'There is a pipeline that runs every night. It pulls raw orders from a source database, loads them into a Kimball model, then runs a mart job that feeds a dashboard. Someone senior watches that dashboard. Wrong numbers erode trust quickly.';

export const DC_STEP1_TASK =
  'You are writing the mart job. Write a CTE that computes the average order amount per customer name for Spanish customers and returns the top 5.';

export const DC_STEP2_INTRO =
  'The pipeline ran again overnight. The upstream team pushed new data. Run your query on the refreshed table and see what comes back.';

export const DC_STEP3_PROSE = [
  'The query did not throw. DuckDB returned rows and the chart rendered. But look at who is in the top 5.',
  "The upstream team made <code>amount</code> nullable. A batch came through with no amounts for the top customers — DuckDB's <code>AVG</code> silently ignored them, and they dropped out of the ranking entirely.",
  'A stakeholder looking at that dashboard would see their top customers disappear overnight.',
  `A contract on <code>${FCT_ORDERS}</code> would have caught this at ingestion, before the mart job ran and faulty data reached the dashboard.`,
  'A data contract is a formal agreement between producer and consumer. At minimum, the producing team declares field types, nullability, and constraints; the consuming team validates incoming data against that declaration at the boundary. A batch that violates the contract fails there instead of propagating silently downstream.',
  'Several formats can express a contract; this lab uses JSON Schema:',
];

export const DC_STEP3_META_REVEAL =
  'One more thing: this lab validated your query output against a contract before rendering the chart in step 1. That is why a query with wrong column names or types returned a hint instead of a broken chart. The same principle, applied one step earlier in the pipeline.';

export const DC_VIOLATION_BLOCK_TITLE = 'What the contract would have thrown at ingestion';

export const DC_LOADING_TEXT = 'Loading DuckDB...';
export const DC_RUN_STEP2_LABEL = 'Run';
export const DC_NEXT_LABEL = 'Next';
export const DC_TOTAL_STEPS = 3;

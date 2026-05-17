import { parse } from 'pgsql-ast-parser';
import { checkCapstoneStructure, checkPruningStructure, checkPushdownStructure } from './challenge-validators';
import {
  CAPSTONE_STARTING_SQL,
  CP_SOLUTION_SQL,
  CP_STARTING_SQL,
  PP_SOLUTION_SQL,
  PP_STARTING_SQL,
} from './distributed-computing.data';

// ── checkPruningStructure ─────────────────────────────────────────────────────

describe('checkPruningStructure', () => {
  const cases: { id: string; sql: string; expected: 'not-optimized' | 'correct' }[] = [
    {
      id: 'flat query without WITH — no pruning possible, passes through',
      sql: 'SELECT product_id, category, unit_price FROM dim_products',
      expected: 'correct',
    },
    {
      id: 'CTE selects * — all columns pulled, pruning not applied',
      sql: CP_STARTING_SQL,
      expected: 'not-optimized',
    },
    {
      id: 'CTE selects extra column beyond the required three',
      sql: `WITH enriched_items AS (
              SELECT product_id, category, unit_price, quantity
              FROM dim_products
            )
            SELECT category FROM enriched_items`,
      expected: 'not-optimized',
    },
    {
      id: 'CTE selects exactly {product_id, category, unit_price}',
      sql: CP_SOLUTION_SQL,
      expected: 'correct',
    },
  ];

  cases.forEach(({ id, sql, expected }) => {
    it(id, () => {
      expect(checkPruningStructure(parse(sql))).toBe(expected);
    });
  });
});

// ── checkPushdownStructure ────────────────────────────────────────────────────

describe('checkPushdownStructure', () => {
  const cases: { id: string; sql: string; expected: 'not-optimized' | 'correct' }[] = [
    {
      id: 'flat query without WITH — no CTE to pushdown into, passes through',
      sql: "SELECT category, COUNT(*) FROM dim_products WHERE category != 'Food' GROUP BY category",
      expected: 'correct',
    },
    {
      id: 'category filter in HAVING but not WHERE — pushdown not applied',
      sql: PP_STARTING_SQL,
      expected: 'not-optimized',
    },
    {
      id: 'category filter moved to WHERE — pushdown applied correctly',
      sql: PP_SOLUTION_SQL,
      expected: 'correct',
    },
  ];

  cases.forEach(({ id, sql, expected }) => {
    it(id, () => {
      expect(checkPushdownStructure(parse(sql))).toBe(expected);
    });
  });
});

// ── checkCapstoneStructure ────────────────────────────────────────────────────

const FLAT_QUERY = `
SELECT c.customer_name, SUM(i.quantity) AS total_items
FROM dim_customers c
JOIN fct_orders o ON c.customer_id = o.customer_id
JOIN fct_order_items i ON o.order_id = i.order_id
WHERE c.country = 'Spain'
GROUP BY c.customer_name
ORDER BY total_items DESC
LIMIT 5`;

const ONE_CTE = `
WITH spanish_customers AS (
  SELECT customer_id, customer_name
  FROM dim_customers
  WHERE country = 'Spain'
)
SELECT s.customer_name, SUM(i.quantity) AS total_items
FROM spanish_customers s
JOIN fct_orders o ON s.customer_id = o.customer_id
JOIN fct_order_items i ON o.order_id = i.order_id
GROUP BY s.customer_name
ORDER BY total_items DESC
LIMIT 5`;

const TWO_CTES = `
WITH spanish_customers AS (
  SELECT customer_id, customer_name
  FROM dim_customers
  WHERE country = 'Spain'
),
customer_totals AS (
  SELECT s.customer_name, SUM(i.quantity) AS total_items
  FROM spanish_customers s
  JOIN fct_orders o ON s.customer_id = o.customer_id
  JOIN fct_order_items i ON o.order_id = i.order_id
  GROUP BY s.customer_name
)
SELECT customer_name, total_items
FROM customer_totals
ORDER BY total_items DESC
LIMIT 5`;

const THREE_CTES = `
WITH spanish_customers AS (
  SELECT customer_id, customer_name
  FROM dim_customers
  WHERE country = 'Spain'
),
orders_with_customers AS (
  SELECT s.customer_name, o.order_id
  FROM spanish_customers s
  JOIN fct_orders o ON s.customer_id = o.customer_id
),
customer_totals AS (
  SELECT o.customer_name, SUM(i.quantity) AS total_items
  FROM orders_with_customers o
  JOIN fct_order_items i ON o.order_id = i.order_id
  GROUP BY o.customer_name
)
SELECT customer_name, total_items
FROM customer_totals
ORDER BY total_items DESC
LIMIT 5`;

describe('checkCapstoneStructure', () => {
  const cases: { id: string; sql: string; expected: 'not-optimized' | 'correct' }[] = [
    {
      id: '0 CTEs — flat query; country filter relies on optimizer pushdown',
      sql: FLAT_QUERY,
      expected: 'not-optimized',
    },
    {
      id: 'starting SQL — CTEs present but dim_customers not filtered in any CTE',
      sql: CAPSTONE_STARTING_SQL,
      expected: 'not-optimized',
    },
    {
      id: '1 CTE — filter and prune dim_customers; join and aggregate in outer SELECT',
      sql: ONE_CTE,
      expected: 'correct',
    },
    {
      id: '2 CTEs — filter and prune in CTE 1; join and aggregate in CTE 2',
      sql: TWO_CTES,
      expected: 'correct',
    },
    {
      id: '3 CTEs — filter and prune in CTE 1; intermediate join in CTE 2; aggregate in CTE 3',
      sql: THREE_CTES,
      expected: 'correct',
    },
  ];

  cases.forEach(({ id, sql, expected }) => {
    it(id, () => {
      expect(checkCapstoneStructure(parse(sql))).toBe(expected);
    });
  });
});

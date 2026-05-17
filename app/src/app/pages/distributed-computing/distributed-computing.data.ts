// ── SQL ───────────────────────────────────────────────────────────────────────

export const CP_STARTING_SQL = `WITH enriched_items AS (
  SELECT *
  FROM dim_products
),
category_revenue AS (
  SELECT
    p.category,
    SUM(i.quantity * p.unit_price) AS revenue
  FROM enriched_items p
  JOIN fct_order_items i ON p.product_id = i.product_id
  GROUP BY p.category
)
SELECT category, revenue
FROM category_revenue
ORDER BY revenue DESC`;

export const CP_SOLUTION_SQL = `WITH enriched_items AS (
  SELECT product_id, category, unit_price
  FROM dim_products
),
category_revenue AS (
  SELECT
    p.category,
    SUM(i.quantity * p.unit_price) AS revenue
  FROM enriched_items p
  JOIN fct_order_items i ON p.product_id = i.product_id
  GROUP BY p.category
)
SELECT category, revenue
FROM category_revenue
ORDER BY revenue DESC`;

export const PP_STARTING_SQL = `WITH product_counts AS (
  SELECT category, COUNT(*) AS product_count
  FROM dim_products
  GROUP BY category
  HAVING COUNT(*) >= 2
    AND category != 'Food'
)
SELECT category, product_count
FROM product_counts
ORDER BY product_count DESC`;

export const PP_SOLUTION_SQL = `WITH product_counts AS (
  SELECT category, COUNT(*) AS product_count
  FROM dim_products
  WHERE category != 'Food'
  GROUP BY category
  HAVING COUNT(*) >= 2
)
SELECT category, product_count
FROM product_counts
ORDER BY product_count DESC`;

export const CAPSTONE_STARTING_SQL = `WITH customer_totals AS (
  SELECT o.customer_id, SUM(i.quantity) AS total_items
  FROM fct_orders o
  JOIN fct_order_items i ON o.order_id = i.order_id
  GROUP BY o.customer_id
)
SELECT c.customer_name, t.total_items
FROM customer_totals t
JOIN dim_customers c ON t.customer_id = c.customer_id
WHERE c.country = 'Spain'
ORDER BY t.total_items DESC
LIMIT 5`;

export const CAPSTONE_SOLUTION_SQL = `WITH spanish_customers AS (
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

// ── expected output ───────────────────────────────────────────────────────────

// Electronics: product 1 (35 qty × 1200) + product 2 (26 qty × 45) + product 3 (28 qty × 89) = 42000 + 1170 + 2492
// Tools: product 4 (24 qty × 135) + product 5 (18 qty × 28) + product 6 (19 qty × 12) = 3240 + 504 + 228
export const CP_EXPECTED_ROWS = [
  { category: 'Electronics', revenue: 45662 },
  { category: 'Tools', revenue: 3972 },
];

export const PP_EXPECTED_ROWS = [
  { category: 'Electronics', product_count: 3 },
  { category: 'Tools', product_count: 3 },
  { category: 'Clothing', product_count: 2 },
];

export const CAPSTONE_EXPECTED_ROWS = [
  { customer_name: 'Grupo Valera', total_items: 32 },
  { customer_name: 'Distribuciones Casas', total_items: 28 },
  { customer_name: 'Comercial Ibérica', total_items: 24 },
  { customer_name: 'Almacenes del Sur', total_items: 20 },
  { customer_name: 'Industrias Bernal', total_items: 16 },
];

// ── step labels ───────────────────────────────────────────────────────────────

export const CONCEPT_NAMES = ['Column pruning', 'Predicate pushdown', 'Minimizing data movement'];

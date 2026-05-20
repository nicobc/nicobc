import type { ExprRef, FromTable, SelectFromStatement, Statement, WithStatement } from 'pgsql-ast-parser';
import { DIM_CUSTOMERS } from '../../labs/data/schema';

function hasRef(expr: unknown, name: string): boolean {
  if (!expr || typeof expr !== 'object') return false;
  const node = expr as Record<string, unknown>;
  if (node['type'] === 'ref' && node['name'] === name) return true;
  return hasRef(node['left'], name) || hasRef(node['right'], name);
}

export function checkPruningStructure(stmts: Statement[]): 'not-optimized' | 'correct' {
  if (!stmts.length || stmts[0].type !== 'with') return 'correct';
  const cte = stmts[0].bind[0]?.statement;
  if (!cte || cte.type !== 'select') return 'correct';
  const cols = cte.columns as { expr: { type: string; name?: string } }[];
  if (!Array.isArray(cols)) return 'correct';
  if (cols.some((c) => c.expr.type === 'ref' && c.expr.name === '*')) return 'not-optimized';
  const names = new Set(cols.map((c) => (c.expr.type === 'ref' ? c.expr.name?.toLowerCase() : '')).filter(Boolean));
  const expected = new Set(['product_id', 'category', 'unit_price']);
  return names.size === expected.size && [...expected].every((n) => names.has(n)) ? 'correct' : 'not-optimized';
}

export function checkPushdownStructure(stmts: Statement[]): 'not-optimized' | 'correct' {
  if (!stmts.length || stmts[0].type !== 'with') return 'correct';
  const cte = stmts[0].bind[0]?.statement;
  if (!cte || cte.type !== 'select') return 'correct';
  const categoryInWhere = hasRef(cte.where, 'category');
  const categoryInHaving = hasRef(cte.having, 'category');
  return !categoryInWhere && categoryInHaving ? 'not-optimized' : 'correct';
}

// Returns 'correct' when at least one CTE scans dim_customers directly (no joins),
// filters by country in WHERE, and does not project country or SELECT *.
// Flat queries without WITH always return 'not-optimized'.
export function checkCapstoneStructure(stmts: Statement[]): 'not-optimized' | 'correct' {
  if (!stmts.length || stmts[0].type !== 'with') return 'not-optimized';
  const withStmt = stmts[0] as WithStatement;
  const optimized = withStmt.bind.some(({ statement }) => {
    if (statement.type !== 'select') return false;
    const stmt = statement as SelectFromStatement;
    const from = stmt.from ?? [];
    if (from.length !== 1 || from[0].type !== 'table') return false;
    if ((from[0] as FromTable).name.name !== DIM_CUSTOMERS) return false;
    if (!hasRef(stmt.where, 'country')) return false;
    const cols = stmt.columns ?? [];
    return !cols.some((c) => {
      if (c.expr.type !== 'ref') return false;
      const { name } = c.expr as ExprRef;
      return name === '*' || name.toLowerCase() === 'country';
    });
  });
  return optimized ? 'correct' : 'not-optimized';
}

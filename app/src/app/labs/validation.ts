import { query, QueryResult } from './db/duckdb';

export type QueryRunResult = { data: QueryResult; error: null } | { data: null; error: string };

export async function runQuery(sql: string): Promise<QueryRunResult> {
  try {
    return { data: await query(sql), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function matchesExpected(rows: QueryResult['rows'], expected: Record<string, unknown>[]): boolean {
  if (rows.length !== expected.length) return false;
  return expected.every((exp, i) => {
    const row = rows[i];
    const expKeys = Object.keys(exp);
    if (Object.keys(row).length !== expKeys.length) return false;
    return expKeys.every((key) => {
      const val = exp[key];
      return typeof val === 'number' ? Math.abs(Number(row[key]) - val) < 0.01 : String(row[key]) === String(val);
    });
  });
}

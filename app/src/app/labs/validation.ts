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
  return expected.every((exp, i) =>
    Object.entries(exp).every(([key, val]) =>
      typeof val === 'number' ? Math.abs(Number(rows[i][key]) - val) < 0.01 : String(rows[i][key]) === String(val),
    ),
  );
}

import { query, QueryResult } from './db/duckdb';

export async function runQuery(sql: string): Promise<QueryResult['rows'] | null> {
  try {
    return (await query(sql)).rows;
  } catch {
    return null;
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

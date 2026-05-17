import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function init(): Promise<duckdb.AsyncDuckDB> {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  const worker = await duckdb.createWorker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const instance = new duckdb.AsyncDuckDB(logger, worker);
  await instance.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return instance;
}

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;
  if (!initPromise)
    initPromise = init().then((instance) => {
      db = instance;
      return instance;
    });
  return initPromise;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}

export async function query(sql: string): Promise<QueryResult> {
  const instance = await getDB();
  const conn = await instance.connect();
  try {
    const result = await conn.query(sql);
    const columns = result.schema.fields.map((f) => f.name);
    const rows = result.toArray().map((row) => Object.fromEntries(columns.map((col) => [col, row[col]])));
    return { columns, rows };
  } finally {
    await conn.close();
  }
}

export async function execute(sql: string): Promise<void> {
  const instance = await getDB();
  const conn = await instance.connect();
  try {
    await conn.query(sql);
  } finally {
    await conn.close();
  }
}

# Project notes

## DuckDB WASM behavioral quirks
Applies to all WASM-based labs (data-contracts, distributed-computing, and any future lab using duckdb-wasm).

**NULLS LAST on DESC** — DuckDB WASM defaults to NULLS LAST for all ORDER BY directions including DESC. Standard DuckDB desktop docs say NULLS FIRST for DESC. Do not assume NULLS FIRST in WASM — verify or use explicit NULLS FIRST/NULLS LAST.

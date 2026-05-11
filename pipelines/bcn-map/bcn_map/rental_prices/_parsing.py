import logging

import duckdb

_CODE_COL = 0
_FIRST_YEAR_COL = 2
# The dataset suppresses figures for areas with fewer than 6 registered contracts.
# Pre-2014 coverage is too sparse — most neighborhoods have no data before that year.
_MIN_YEAR = 2014
_SECTION_LABEL = "Barris"

logger = logging.getLogger(__name__)


def parse_prices(raw: list[list]) -> list[dict]:
    """Parse raw Excel rows into a flat list of (year, neighborhood_code, price_per_sqm) records.

    The source layout has years as columns and neighborhoods as rows, preceded by header rows and
    section labels that must be skipped. Years before _MIN_YEAR are dropped (sparse coverage).
    Prices that cannot be parsed as numeric are kept as None (suppressed by the source for thin samples).
    """
    years = [int(y) for y in raw[0][_FIRST_YEAR_COL:] if y is not None]

    barri_idx = next(
        i for i, row in enumerate(raw) if str(row[1] or "").startswith(_SECTION_LABEL)
    )

    conn = duckdb.connect()
    year_col_ddl = ", ".join(f'"{y}" VARCHAR' for y in years)
    conn.execute(f"CREATE TABLE wide (neighborhood_code INTEGER, {year_col_ddl})")

    placeholders = ", ".join(["?"] * (1 + len(years)))
    n_rows = 0
    for row in raw[barri_idx + 1 :]:
        try:
            code = int(row[_CODE_COL])
        except (TypeError, ValueError):
            continue
        prices = [
            str(row[_FIRST_YEAR_COL + i])
            if row[_FIRST_YEAR_COL + i] is not None
            else None
            for i in range(len(years))
        ]
        conn.execute(f"INSERT INTO wide VALUES ({placeholders})", [code] + prices)
        n_rows += 1

    filtered_years = [y for y in years if y >= _MIN_YEAR]
    n_years = len(filtered_years)
    year_selects = " UNION ALL ".join(
        f'SELECT neighborhood_code, {y} AS year, "{y}" AS price_per_sqm FROM wide'
        for y in filtered_years
    )

    records = conn.execute(f"""
        SELECT
            year,
            neighborhood_code,
            ROUND(TRY_CAST(price_per_sqm AS DOUBLE), 2) AS price_per_sqm
        FROM ({year_selects})
        ORDER BY neighborhood_code, year
    """).fetchall()

    logger.info(
        f"Parsed {len(records):,} records ({n_rows} neighborhoods × {n_years} years, {_MIN_YEAR}–{max(years)})"
    )
    return [
        {"year": r[0], "neighborhood_code": r[1], "price_per_sqm": r[2]}
        for r in records
    ]

import logging

import duckdb

from bcn_map.enums.admin_geo import AdminLevel
from bcn_map.enums.geojson import GeoJsonKey, GeoJsonProp

logger = logging.getLogger(__name__)

_PRE_COVID_YEAR = 2019
_SQM = 80


def extract_neighborhood_names(geojson: dict) -> dict[int, str]:
    return {
        f[GeoJsonKey.PROPERTIES][GeoJsonProp.CODE]: f[GeoJsonKey.PROPERTIES][
            GeoJsonProp.NAME
        ]
        for f in geojson[GeoJsonKey.FEATURES]
        if f[GeoJsonKey.PROPERTIES][GeoJsonProp.LEVEL] == AdminLevel.NEIGHBORHOOD
    }


def summarize(records: list[dict], names: dict[int, str]) -> dict:
    conn = _connect(records)
    row = conn.execute("SELECT MAX(year) FROM records").fetchone()
    assert row is not None
    max_year: int = row[0]
    volatile_codes = _find_volatile_codes(conn)

    priciest = _compute_priciest(conn, names, max_year)
    biggest_surge = _compute_biggest_surge(conn, names, max_year, volatile_codes)
    city_avg = _compute_city_avg(conn, max_year)

    logger.info(f"Summarized insights for {max_year} vs {_PRE_COVID_YEAR}")
    return {
        "priciest": priciest,
        "biggest_surge": biggest_surge,
        "city_avg": city_avg,
        "suppressed_neighborhoods": sorted(volatile_codes),
    }


def _connect(records: list[dict]) -> duckdb.DuckDBPyConnection:
    conn = duckdb.connect()
    conn.execute(
        "CREATE TABLE records (year INTEGER, neighborhood_code INTEGER, price_per_sqm DOUBLE)"
    )
    conn.executemany(
        "INSERT INTO records VALUES (?, ?, ?)",
        [(r["year"], r["neighborhood_code"], r["price_per_sqm"]) for r in records],
    )
    return conn


def _compute_priciest(
    conn: duckdb.DuckDBPyConnection, names: dict[int, str], year: int
) -> dict:
    row = conn.execute(
        """
        SELECT neighborhood_code, price_per_sqm
        FROM records
        WHERE year = ? AND price_per_sqm IS NOT NULL
        ORDER BY price_per_sqm DESC
        LIMIT 1
        """,
        [year],
    ).fetchone()
    assert row is not None
    return {
        "neighborhood": names.get(row[0], ""),
        "price_per_sqm": round(row[1], 2),
        "year": year,
    }


def _find_volatile_codes(
    conn: duckdb.DuckDBPyConnection, max_yoy_swing: float = 0.40
) -> set[int]:
    """Return neighborhood codes whose price history is too volatile to be reliable.

    The source dataset does not publish sample sizes, so there is no direct way to
    distinguish a genuine structural rise from noise caused by thin coverage. YoY
    volatility is the only available proxy: neighborhoods whose price swings wildly
    from year to year are almost certainly under-sampled, not genuinely volatile
    markets. `max_yoy_swing` caps the maximum single-year relative change a
    neighborhood may exhibit to be considered stable; the default of 0.40 (40%) is
    chosen conservatively — any legitimate market move of that magnitude would be
    front-page news.
    """
    rows = conn.execute(
        """
        WITH yoy AS (
            SELECT
                neighborhood_code,
                price_per_sqm,
                LAG(price_per_sqm) OVER (PARTITION BY neighborhood_code ORDER BY year) AS prev_price
            FROM records
            WHERE price_per_sqm IS NOT NULL
        )
        SELECT DISTINCT neighborhood_code
        FROM yoy
        WHERE prev_price > 0
          AND ABS(price_per_sqm / prev_price - 1) > ?
        """,
        [max_yoy_swing],
    ).fetchall()
    volatile = {row[0] for row in rows}
    if volatile:
        logger.debug(
            f"Volatility filter flagged {len(volatile)} neighborhood(s): {sorted(volatile)}"
        )
    return volatile


def _compute_biggest_surge(
    conn: duckdb.DuckDBPyConnection,
    names: dict[int, str],
    year: int,
    volatile_codes: set[int],
) -> dict:
    row = conn.execute(
        """
        WITH stable AS (
            SELECT neighborhood_code, year, price_per_sqm
            FROM records
            WHERE price_per_sqm IS NOT NULL
              AND NOT list_contains(?, neighborhood_code)
        ),
        latest AS (
            SELECT neighborhood_code, price_per_sqm AS price_now
            FROM stable WHERE year = ?
        ),
        pre_covid AS (
            SELECT neighborhood_code, price_per_sqm AS price_pre
            FROM stable WHERE year = ?
        )
        SELECT
            l.neighborhood_code,
            ROUND((l.price_now - p.price_pre) * ?, 0) AS delta_monthly,
            ROUND((l.price_now - p.price_pre) / p.price_pre * 100, 1) AS pct_change
        FROM latest l
        JOIN pre_covid p USING (neighborhood_code)
        ORDER BY delta_monthly DESC
        LIMIT 1
        """,
        [list(volatile_codes), year, _PRE_COVID_YEAR, _SQM],
    ).fetchone()
    assert row is not None
    return {
        "neighborhood": names.get(row[0], ""),
        "delta_monthly_80sqm": int(row[1]),
        "pct_change": row[2],
        "pre_covid_year": _PRE_COVID_YEAR,
        "year": year,
    }


def _compute_city_avg(conn: duckdb.DuckDBPyConnection, year: int) -> dict:
    row = conn.execute(
        """
        SELECT
            ROUND(AVG(CASE WHEN year = ? THEN price_per_sqm END), 2) AS latest_avg,
            ROUND(AVG(CASE WHEN year = ? THEN price_per_sqm END), 2) AS pre_covid_avg
        FROM records
        WHERE price_per_sqm IS NOT NULL
        """,
        [year, _PRE_COVID_YEAR],
    ).fetchone()
    assert row is not None
    latest_avg, pre_covid_avg = row[0], row[1]
    pct_change = round((latest_avg - pre_covid_avg) / pre_covid_avg * 100, 1)
    return {
        "price_per_sqm": latest_avg,
        "pre_covid_price_per_sqm": pre_covid_avg,
        "pct_change": pct_change,
        "pre_covid_year": _PRE_COVID_YEAR,
        "year": year,
    }

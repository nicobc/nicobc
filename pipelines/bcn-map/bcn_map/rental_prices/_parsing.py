import logging

import pandas as pd

_CODE_COL = 0
_FIRST_YEAR_COL = 2
# The dataset suppresses figures for areas with fewer than 6 registered contracts.
# Pre-2014 coverage is too sparse — most neighborhoods have no data before that year.
_MIN_YEAR = 2014

_COL_NEIGHBORHOOD_CODE = "neighborhood_code"
_COL_YEAR = "year"
_COL_PRICE = "price_per_sqm"

logger = logging.getLogger(__name__)


def parse_prices(raw: pd.DataFrame) -> list[dict]:
    """Parse the raw Excel DataFrame into a flat list of (year, neighborhood_code, price_per_sqm) records.

    The source layout has years as columns and neighborhoods as rows, preceded by header rows and
    section labels that must be skipped. Years before _MIN_YEAR are dropped (sparse coverage).
    Prices that cannot be parsed as numeric are kept as None (suppressed by the source for thin samples).
    """
    years = _parse_years(raw)
    rows = _extract_neighborhood_rows(raw)
    records = _build_records(rows, years)
    n_years = sum(1 for y in years if y >= _MIN_YEAR)
    logger.info(f"Parsed {len(records):,} records ({len(rows)} neighborhoods × {n_years} years, {_MIN_YEAR}–{max(years)})")
    return records


def _parse_years(raw: pd.DataFrame) -> list[int]:
    return [int(y) for y in raw.iloc[0, _FIRST_YEAR_COL:]]


def _extract_neighborhood_rows(raw: pd.DataFrame) -> pd.DataFrame:
    data = raw.iloc[1:]  # skip year-header row
    barri_mask = data.iloc[:, 1].astype(str).str.startswith("Barris", na=False)
    barri_start = data.index[barri_mask][0] + 1
    candidates = data.loc[barri_start:]
    has_code = pd.to_numeric(candidates.iloc[:, _CODE_COL], errors="coerce").notna()
    return candidates[has_code]


def _build_records(rows: pd.DataFrame, years: list[int]) -> list[dict]:
    """Reshape the wide Excel layout (one column per year) into a flat list of records.

    stack() unpivots the wide price table so each (neighborhood, year) pair becomes
    its own row; one pd.to_numeric call then coerces the entire price column at once.

        wide (one col per year):              long (one row per pair):
        code | 2022 | 2023                    neighborhood_code | year | price_per_sqm
        -----+------+-----        stack()     ------------------+------+--------------
           8 | 12.5 | 13.1       -------->                   8 | 2022 |         12.50
           9 | 10.0 |  NaN                                   8 | 2023 |         13.10
                                                             9 | 2022 |         10.00
                                                             9 | 2023 |          None
    """
    prices = rows.iloc[:, _FIRST_YEAR_COL:].copy()
    prices.columns = pd.Index(years)
    prices = prices[[y for y in years if y >= _MIN_YEAR]]
    prices.insert(0, _COL_NEIGHBORHOOD_CODE, rows.iloc[:, _CODE_COL].astype(int).values)
    long = prices.set_index(_COL_NEIGHBORHOOD_CODE).stack().reset_index()
    long.columns = pd.Index([_COL_NEIGHBORHOOD_CODE, _COL_YEAR, _COL_PRICE])
    long[_COL_PRICE] = pd.to_numeric(long[_COL_PRICE], errors="coerce").round(2)
    # NaN → None so downstream json.dumps serialises missing prices as null
    long[_COL_PRICE] = long[_COL_PRICE].astype(object).where(long[_COL_PRICE].notna(), other=None)
    return long[[_COL_YEAR, _COL_NEIGHBORHOOD_CODE, _COL_PRICE]].to_dict(orient="records")

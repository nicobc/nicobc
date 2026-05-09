import logging

import pandas as pd

logger = logging.getLogger(__name__)

_CODE_COL = 0
_FIRST_YEAR_COL = 2
# The dataset suppresses figures for areas with fewer than 6 registered contracts.
# Pre-2014 coverage is too sparse — most neighborhoods have no data before that year.
_MIN_YEAR = 2014


def read_prices(path: str) -> list[dict]:
    raw = pd.read_excel(path, header=None, skiprows=4, engine="openpyxl")
    years = _parse_years(raw)
    rows = _extract_neighborhood_rows(raw)
    records = _build_records(rows, years)
    n_years = sum(1 for y in years if y >= _MIN_YEAR)
    logger.info(f"Read {len(records):,} records ({len(rows)} neighborhoods × {n_years} years, {_MIN_YEAR}–{years[0]})")
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
    records = []
    for _, row in rows.iterrows():
        code = int(row.iloc[_CODE_COL])
        for i, year in enumerate(years):
            if year < _MIN_YEAR:
                continue
            numeric = pd.to_numeric(row.iloc[_FIRST_YEAR_COL + i], errors="coerce")
            price = round(float(numeric), 2) if pd.notna(numeric) else None
            records.append({"year": year, "neighborhood_code": code, "price_per_sqm": price})
    return records

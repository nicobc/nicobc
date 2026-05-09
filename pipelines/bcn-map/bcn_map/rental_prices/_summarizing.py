import json
import logging

import pandas as pd

from bcn_map.admin_geo.constants.paths import ADMIN_BOUNDARIES_OUTPUT
from bcn_map.rental_prices._reading import _MIN_YEAR

logger = logging.getLogger(__name__)

_PRE_COVID_YEAR = 2019
_SQM = 80


def summarize(records: list[dict]) -> dict:
    df = pd.DataFrame(records)
    names = _load_neighborhood_names()
    max_year = int(df["year"].max())
    volatile_codes = _find_volatile_codes(df)

    priciest = _compute_priciest(df, names, max_year)
    biggest_surge = _compute_biggest_surge(df, names, max_year, volatile_codes)
    city_avg = _compute_city_avg(df, max_year)

    logger.info(f"Summarized insights for {max_year} vs {_PRE_COVID_YEAR}")
    return {
        "priciest": priciest,
        "biggest_surge": biggest_surge,
        "city_avg": city_avg,
        "suppressed_neighborhoods": sorted(volatile_codes),
    }


def _load_neighborhood_names() -> dict[int, str]:
    with open(ADMIN_BOUNDARIES_OUTPUT, encoding="utf-8") as f:
        geojson = json.load(f)
    return {
        f["properties"]["code"]: f["properties"]["name"]
        for f in geojson["features"]
        if f["properties"]["level"] == "neighborhood"
    }


def _compute_priciest(df: pd.DataFrame, names: dict[int, str], year: int) -> dict:
    latest = df[df["year"] == year].dropna(subset=["price_per_sqm"])
    row = latest.loc[latest["price_per_sqm"].idxmax()]
    return {
        "neighborhood": names.get(int(row["neighborhood_code"]), ""),
        "price_per_sqm": round(float(row["price_per_sqm"]), 2),
        "year": year,
    }


def _find_volatile_codes(df: pd.DataFrame, max_yoy_swing: float = 0.40) -> set[int]:
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
    pivot = df.pivot(index="neighborhood_code", columns="year", values="price_per_sqm")
    max_swing = pivot.pct_change(axis=1).abs().max(axis=1)
    volatile = set(max_swing[max_swing > max_yoy_swing].index)
    if volatile:
        logger.debug(f"Volatility filter flagged {len(volatile)} neighborhood(s): {sorted(volatile)}")
    return volatile


def _compute_biggest_surge(
    df: pd.DataFrame, names: dict[int, str], year: int, volatile_codes: set[int]
) -> dict:
    stable_df = df[~df["neighborhood_code"].isin(volatile_codes)]
    latest = stable_df[stable_df["year"] == year][["neighborhood_code", "price_per_sqm"]].dropna()
    pre_covid = stable_df[stable_df["year"] == _PRE_COVID_YEAR][["neighborhood_code", "price_per_sqm"]].dropna()
    merged = latest.merge(pre_covid, on="neighborhood_code", suffixes=("_now", "_pre"))
    merged = merged.assign(
        delta_monthly=(merged["price_per_sqm_now"] - merged["price_per_sqm_pre"]) * _SQM,
        pct_change=(merged["price_per_sqm_now"] - merged["price_per_sqm_pre"]) / merged["price_per_sqm_pre"] * 100,
    )
    row = merged.loc[merged["delta_monthly"].idxmax()]
    return {
        "neighborhood": names.get(int(row["neighborhood_code"]), ""),
        "delta_monthly_80sqm": round(float(row["delta_monthly"])),
        "pct_change": round(float(row["pct_change"]), 1),
        "pre_covid_year": _PRE_COVID_YEAR,
        "year": year,
    }


def _compute_city_avg(df: pd.DataFrame, year: int) -> dict:
    avg = df.groupby("year")["price_per_sqm"].mean()
    latest_avg = float(avg[year])
    pre_covid_avg = float(avg[_PRE_COVID_YEAR])
    pct_change = (latest_avg - pre_covid_avg) / pre_covid_avg * 100
    return {
        "price_per_sqm": round(latest_avg, 2),
        "pre_covid_price_per_sqm": round(pre_covid_avg, 2),
        "pct_change": round(pct_change, 1),
        "pre_covid_year": _PRE_COVID_YEAR,
        "year": year,
    }

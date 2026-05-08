import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

from bcn_map.metrics.constants.cadastral_ownership import (
    COL_AVG_VALUE,
    COL_AVG_VALUE_LEGAL,
    COL_AVG_VALUE_PHYSICAL,
    COL_DELTA_N_LEGAL_BASELINE,
    COL_DELTA_N_LEGAL_FROM_PRE_COVID,
    COL_DELTA_N_LEGAL_YOY,
    COL_DELTA_PCT_LEGAL_BASELINE,
    COL_DELTA_PCT_LEGAL_FROM_PRE_COVID,
    COL_DELTA_PCT_LEGAL_YOY,
    COL_N_TOTAL,
    COL_PCT_LEGAL,
    COL_VALUE_INDEX,
    COL_VALUE_TOTAL,
    COL_YEAR,
    Owner,
    SECTION_KEY,
)
from bcn_map.metrics.constants.periods import BASELINE_YEAR, PRE_COVID_YEAR

_N_LEGAL = f"n_{Owner.LEGAL}"
_N_PHYSICAL = f"n_{Owner.PHYSICAL}"
_VALUE_LEGAL = f"value_{Owner.LEGAL}"
_VALUE_PHYSICAL = f"value_{Owner.PHYSICAL}"

_REF_N = "_ref_n"
_REF_PCT = "_ref_pct"


def compute(df: pd.DataFrame) -> pd.DataFrame:
    logger.info(f"Computing metrics for {len(df):,} section-year combinations")
    return (
        df
        .pipe(_compute_base_metrics)
        .pipe(_compute_value_index)
        .pipe(_compute_deltas)
    )


def _compute_base_metrics(df: pd.DataFrame) -> pd.DataFrame:
    n_lp = df[_N_LEGAL] + df[_N_PHYSICAL]
    df.loc[:, COL_PCT_LEGAL] = df[_N_LEGAL] / n_lp
    df.loc[:, COL_AVG_VALUE] = df[COL_VALUE_TOTAL] / df[COL_N_TOTAL]
    df.loc[:, COL_AVG_VALUE_LEGAL] = df[_VALUE_LEGAL] / df[_N_LEGAL]
    df.loc[:, COL_AVG_VALUE_PHYSICAL] = df[_VALUE_PHYSICAL] / df[_N_PHYSICAL]
    return df


def _compute_value_index(df: pd.DataFrame) -> pd.DataFrame:
    city_avg = df.groupby(COL_YEAR)[COL_AVG_VALUE].transform("mean")
    df.loc[:, COL_VALUE_INDEX] = df[COL_AVG_VALUE] / city_avg
    return df


def _compute_deltas(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values([*SECTION_KEY, COL_YEAR])
    df.loc[:, COL_DELTA_N_LEGAL_YOY] = df.groupby(SECTION_KEY)[_N_LEGAL].diff()
    df.loc[:, COL_DELTA_PCT_LEGAL_YOY] = df.groupby(SECTION_KEY)[COL_PCT_LEGAL].diff()
    return (
        df
        .pipe(_compute_delta_vs_reference_year, BASELINE_YEAR, COL_DELTA_N_LEGAL_BASELINE, COL_DELTA_PCT_LEGAL_BASELINE)
        .pipe(_compute_delta_vs_reference_year, PRE_COVID_YEAR, COL_DELTA_N_LEGAL_FROM_PRE_COVID, COL_DELTA_PCT_LEGAL_FROM_PRE_COVID)
    )


def _compute_delta_vs_reference_year(
    df: pd.DataFrame,
    year: int,
    delta_n_col: str,
    delta_pct_col: str,
) -> pd.DataFrame:
    ref = (
        df.loc[df[COL_YEAR] == year, SECTION_KEY + [_N_LEGAL, COL_PCT_LEGAL]]
        .rename(columns={_N_LEGAL: _REF_N, COL_PCT_LEGAL: _REF_PCT})
    )
    df = df.merge(ref, on=SECTION_KEY, how="left")
    df.loc[:, delta_n_col] = df[_N_LEGAL] - df[_REF_N]
    df.loc[:, delta_pct_col] = df[COL_PCT_LEGAL] - df[_REF_PCT]
    return df.drop(columns=[_REF_N, _REF_PCT])

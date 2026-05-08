import logging
from pathlib import Path

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
    COL_DISTRICT_CODE,
    COL_N_TOTAL,
    COL_PCT_LEGAL,
    COL_SECTION_CODE,
    COL_VALUE_INDEX,
    COL_VALUE_TOTAL,
    COL_YEAR,
    Owner,
)

_OUTPUT_COLS = [
    COL_YEAR,
    COL_DISTRICT_CODE,
    COL_SECTION_CODE,
    f"n_{Owner.LEGAL}",
    f"n_{Owner.PHYSICAL}",
    COL_N_TOTAL,
    COL_VALUE_TOTAL,
    COL_PCT_LEGAL,
    COL_AVG_VALUE,
    COL_AVG_VALUE_LEGAL,
    COL_AVG_VALUE_PHYSICAL,
    COL_VALUE_INDEX,
    COL_DELTA_N_LEGAL_YOY,
    COL_DELTA_PCT_LEGAL_YOY,
    COL_DELTA_N_LEGAL_BASELINE,
    COL_DELTA_PCT_LEGAL_BASELINE,
    COL_DELTA_N_LEGAL_FROM_PRE_COVID,
    COL_DELTA_PCT_LEGAL_FROM_PRE_COVID,
]


def write(df: pd.DataFrame, output_path: str) -> None:
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    logger.info(f"Writing {len(df):,} records to {output_path}")
    df[_OUTPUT_COLS].to_json(path, orient="records")

import glob
import logging

import pandas as pd

logger = logging.getLogger(__name__)

from bcn_map.metrics.constants.cadastral_ownership import (
    RAW_CONCEPT,
    RAW_DISTRICT_CODE,
    RAW_OWNER_TYPE,
    RAW_SECTION_CODE,
    RAW_VALUE,
    RAW_YEAR,
)

_ENCODINGS = ("utf-8-sig", "latin-1")
_USECOLS = [RAW_YEAR, RAW_DISTRICT_CODE, RAW_SECTION_CODE, RAW_OWNER_TYPE, RAW_CONCEPT, RAW_VALUE]
_DTYPES = {RAW_VALUE: float}
_INT_COLS = [RAW_YEAR, RAW_DISTRICT_CODE, RAW_SECTION_CODE]


def read_all(raw_dir: str) -> pd.DataFrame:
    paths = sorted(glob.glob(f"{raw_dir}/*.csv"))
    if not paths:
        raise FileNotFoundError(f"No CSV files found in {raw_dir}")
    logger.info(f"Reading {len(paths):,} files from {raw_dir}")
    df = pd.concat([_read_csv(p) for p in paths], ignore_index=True)
    mask = df[_INT_COLS].apply(lambda s: pd.to_numeric(s, errors="coerce").notna()).all(axis=1)
    n_dropped = (~mask).sum()
    if n_dropped:
        logger.warning(f"Dropped {n_dropped:,} rows with non-numeric geo codes")
    df = df.loc[mask].copy()
    df.loc[:, _INT_COLS] = df[_INT_COLS].astype(int)
    logger.info(f"Loaded {len(df):,} rows across {df[RAW_YEAR].nunique()} years")
    return df


def _read_csv(path: str) -> pd.DataFrame:
    for encoding in _ENCODINGS:
        try:
            df = pd.read_csv(path, usecols=_USECOLS, dtype=_DTYPES, encoding=encoding)
            logger.debug(f"Read {path}: {len(df)} rows ({encoding})")
            return df
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Could not decode {path} with encodings {_ENCODINGS}")

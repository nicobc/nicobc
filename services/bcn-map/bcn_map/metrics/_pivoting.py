import logging

import pandas as pd

logger = logging.getLogger(__name__)

from bcn_map.metrics.constants.cadastral_ownership import (
    CONCEPT_MAP,
    COL_DISTRICT_CODE,
    COL_N_TOTAL,
    COL_SECTION_CODE,
    COL_VALUE_TOTAL,
    COL_YEAR,
    Concept,
    OWNER_MAP,
    Owner,
    RAW_CONCEPT,
    RAW_DISTRICT_CODE,
    RAW_OWNER_TYPE,
    RAW_SECTION_CODE,
    RAW_VALUE,
    RAW_YEAR,
)

_OWNER_COL = "_owner"
_CONCEPT_COL = "_concept"
_CONCEPT_PREFIX = {Concept.COUNT: "n", Concept.VALUE: "value"}


def pivot(df: pd.DataFrame) -> pd.DataFrame:
    """Transform long-format cadastral data into one row per (year, district, section).

    Args:
        df: Raw DataFrame with one row per (year, section, owner_type, concept),
            as returned by ``read_all``.

    Returns:
        Wide DataFrame with columns ``n_{owner}`` and ``value_{owner}`` for each
        owner type, plus ``n_total`` and ``value_total`` aggregates.

    Example:
        >>> raw = pd.DataFrame({
        ...     "Any": [2026, 2026, 2026],
        ...     "Codi_districte": [1, 1, 1],
        ...     "Seccio_censal": [1, 1, 1],
        ...     "Desc_tipus_propietari": ["Subjecte físic", "Subjecte jurídic", "Subjecte físic"],
        ...     "Concepte": ["Nombre", "Nombre", "Valor_cadastral"],
        ...     "Valor": [120.0, 45.0, 40_000_000.0],
        ... })
        >>> pivot(raw)
           year  district_code  section_code  n_legal  n_physical  ...  n_total  value_total
        0  2026              1             1     45.0       120.0  ...    165.0  40000000.0
    """
    df = df.rename(columns={
        RAW_YEAR: COL_YEAR,
        RAW_DISTRICT_CODE: COL_DISTRICT_CODE,
        RAW_SECTION_CODE: COL_SECTION_CODE,
    })
    df = df.assign(
        **{_OWNER_COL: df[RAW_OWNER_TYPE].map(OWNER_MAP)},
        **{_CONCEPT_COL: df[RAW_CONCEPT].map(CONCEPT_MAP)},
    )
    unmapped = df[df[[_OWNER_COL, _CONCEPT_COL]].isna().any(axis=1)]
    if not unmapped.empty:
        for col, raw_col in [(_OWNER_COL, RAW_OWNER_TYPE), (_CONCEPT_COL, RAW_CONCEPT)]:
            unknown = unmapped.loc[unmapped[col].isna(), raw_col].unique()
            if unknown.size:
                logger.warning(f"Dropping {unmapped[col].isna().sum():,} rows with unmapped {raw_col}: {list(unknown)}")
    df = df.dropna(subset=[_OWNER_COL, _CONCEPT_COL])

    wide = (
        df.groupby([COL_YEAR, COL_DISTRICT_CODE, COL_SECTION_CODE, _CONCEPT_COL, _OWNER_COL])[RAW_VALUE]
        .sum()
        .unstack([_CONCEPT_COL, _OWNER_COL])
        .fillna(0)
    )
    wide.columns = [f"{_CONCEPT_PREFIX[c]}_{o}" for c, o in wide.columns]
    wide = wide.reset_index()

    wide[COL_N_TOTAL] = wide[[f"n_{o}" for o in Owner]].sum(axis=1)
    wide[COL_VALUE_TOTAL] = wide[[f"value_{o}" for o in Owner]].sum(axis=1)

    logger.info(f"Pivoted {len(df):,} rows → {len(wide):,} section-year combinations")
    return wide

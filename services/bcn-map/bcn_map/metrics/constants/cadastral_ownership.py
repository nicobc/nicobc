from enum import StrEnum, auto


# Raw CSV column names
RAW_YEAR = "Any"
RAW_DISTRICT_CODE = "Codi_districte"
RAW_SECTION_CODE = "Seccio_censal"
RAW_OWNER_TYPE = "Desc_tipus_propietari"
RAW_CONCEPT = "Concepte"
RAW_VALUE = "Valor"


class Owner(StrEnum):
    PHYSICAL = auto()
    LEGAL = auto()
    COMMUNITY = auto()
    OTHER = auto()


class Concept(StrEnum):
    COUNT = auto()
    VALUE = auto()


OWNER_MAP: dict[str, Owner] = {
    "Subjecte físic": Owner.PHYSICAL,
    "Subjecte Fìsic": Owner.PHYSICAL,  # accent variant in some years
    "Subjecte jurídic": Owner.LEGAL,
    "Comunitat de propietaris": Owner.COMMUNITY,
    "Altres": Owner.OTHER,
}

CONCEPT_MAP: dict[str, Concept] = {
    "Nombre": Concept.COUNT,
    "Valor_cadastral": Concept.VALUE,
    "Valor_cad_€": Concept.VALUE,  # 2018 uses a different label
}

# Output column names
COL_YEAR = "year"
COL_DISTRICT_CODE = "district_code"
COL_SECTION_CODE = "section_code"
COL_N_TOTAL = "n_total"
COL_VALUE_TOTAL = "value_total"
COL_PCT_LEGAL = "pct_legal"
COL_AVG_VALUE = "avg_value"
COL_AVG_VALUE_LEGAL = "avg_value_legal"
COL_AVG_VALUE_PHYSICAL = "avg_value_physical"
COL_VALUE_INDEX = "value_index"
COL_DELTA_N_LEGAL_YOY = "delta_n_legal_yoy"
COL_DELTA_PCT_LEGAL_YOY = "delta_pct_legal_yoy"
COL_DELTA_N_LEGAL_BASELINE = "delta_n_legal_baseline"
COL_DELTA_PCT_LEGAL_BASELINE = "delta_pct_legal_baseline"
COL_DELTA_N_LEGAL_FROM_PRE_COVID = "delta_n_legal_from_pre_covid"
COL_DELTA_PCT_LEGAL_FROM_PRE_COVID = "delta_pct_legal_from_pre_covid"

SECTION_KEY = [COL_DISTRICT_CODE, COL_SECTION_CODE]

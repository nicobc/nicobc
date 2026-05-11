import json
import logging

import pandas as pd

from bcn_map.admin_geo.constants.paths import ADMIN_BOUNDARIES_OUTPUT

logger = logging.getLogger(__name__)


def load_admin_boundaries() -> dict:
    with open(ADMIN_BOUNDARIES_OUTPUT, encoding="utf-8") as f:
        return json.load(f)


def read_prices(path: str) -> pd.DataFrame:
    return pd.read_excel(path, header=None, skiprows=4, engine="openpyxl")

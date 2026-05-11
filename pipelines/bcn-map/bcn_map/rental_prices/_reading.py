import json
import logging

import openpyxl

from bcn_map.admin_geo.constants.paths import ADMIN_BOUNDARIES_OUTPUT

_DATA_START_ROW = 5

logger = logging.getLogger(__name__)


def load_admin_boundaries() -> dict:
    with open(ADMIN_BOUNDARIES_OUTPUT, encoding="utf-8") as f:
        return json.load(f)


def read_prices(path: str) -> list[list]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        ws = wb.active
        assert ws is not None, f"No active sheet in {path}"
        return [
            list(row) for row in ws.iter_rows(min_row=_DATA_START_ROW, values_only=True)
        ]
    finally:
        wb.close()

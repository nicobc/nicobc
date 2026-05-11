import json
import logging
import os

logger = logging.getLogger(__name__)


def write(records: list[dict] | dict, path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, separators=(",", ":"))
    logger.info(f"Written → {path} ({os.path.getsize(path) / 1024:.1f} KB)")

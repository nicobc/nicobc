import json
import logging
import os

logger = logging.getLogger(__name__)


def write(geojson: dict, path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, separators=(",", ":"), ensure_ascii=False)
    logger.info(f"Written → {path} ({os.path.getsize(path) / 1024:.1f} KB)")

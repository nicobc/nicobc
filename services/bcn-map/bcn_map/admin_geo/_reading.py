import json
import logging

from bcn_map.admin_geo.constants.admin_boundaries import LEVEL_NAMES, RAW_LEVEL

logger = logging.getLogger(__name__)


def read_features(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    all_features = data["features"]
    features = [f for f in all_features if f["properties"][RAW_LEVEL] in LEVEL_NAMES]
    logger.info(f"Extracted {len(features):,} features from {len(all_features):,} total")
    return features

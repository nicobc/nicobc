import logging

from pyproj import Transformer
from shapely.geometry import mapping, shape
from shapely.ops import transform

from bcn_map.admin_geo.constants.admin_boundaries import LEVEL_NAMES, RAW_CODE, RAW_DISTRICT, RAW_LEVEL, RAW_NAME

logger = logging.getLogger(__name__)

# Module-level to avoid recreating on every geometry call
_TRANSFORMER = Transformer.from_crs("EPSG:25831", "EPSG:4326", always_xy=True)


def project(features: list[dict]) -> dict:
    output_features = [
        {
            "type": "Feature",
            "properties": _extract_properties(f["properties"]),
            "geometry": _reproject(f["geometry"]),
        }
        for f in features
    ]
    logger.info(f"Reprojected {len(output_features):,} features to WGS84")
    return {"type": "FeatureCollection", "features": output_features}


def _reproject(geometry: dict) -> dict:
    return mapping(transform(_TRANSFORMER.transform, shape(geometry)))


def _extract_properties(props: dict) -> dict:
    return {
        "level": LEVEL_NAMES[props[RAW_LEVEL]],
        "name": props[RAW_NAME].strip() or None,
        "district_code": props.get(RAW_DISTRICT) or None,
        "code": int(props[RAW_CODE].strip()) if props[RAW_CODE].strip() else None,
    }

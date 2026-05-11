import logging

from pyproj import Transformer
from shapely.geometry import mapping, shape
from shapely.ops import transform

from bcn_map.admin_geo.constants.admin_boundaries import (
    ADMIN_LEVEL_NAMES,
    RAW_CODE,
    RAW_DISTRICT,
    RAW_LEVEL,
    RAW_NAME,
)
from bcn_map.enums.geojson import GeoJsonKey, GeoJsonProp

logger = logging.getLogger(__name__)

_SRC_CRS = "EPSG:25831"
_DST_CRS = "EPSG:4326"
# Module-level to avoid recreating on every geometry call
_TRANSFORMER = Transformer.from_crs(_SRC_CRS, _DST_CRS, always_xy=True)
_COORD_PRECISION = 10


def project(features: list[dict]) -> dict:
    output_features = [
        {
            GeoJsonKey.TYPE: "Feature",
            GeoJsonKey.PROPERTIES: _extract_properties(f[GeoJsonKey.PROPERTIES]),
            GeoJsonKey.GEOMETRY: _reproject(f[GeoJsonKey.GEOMETRY]),
        }
        for f in features
    ]
    logger.info(f"Reprojected {len(output_features):,} features to WGS84")
    return {GeoJsonKey.TYPE: "FeatureCollection", GeoJsonKey.FEATURES: output_features}


def _reproject(geometry: dict) -> dict:
    geom = mapping(transform(_TRANSFORMER.transform, shape(geometry)))
    return {**geom, GeoJsonKey.COORDINATES: _round_coords(geom[GeoJsonKey.COORDINATES])}


def _round_coords(coords: tuple) -> tuple:
    """Round coordinate values to _COORD_PRECISION decimal places.

    pyproj's floating-point output varies at the 15th–16th significant digit across
    PROJ library versions and platforms. Without rounding, hardcoded expected coordinates
    in tests diverge between environments (e.g. macOS vs Linux CI). 10 decimal places
    gives ~1mm precision on Earth's surface, which is far beyond any real need here.

    Recurses because shapely.mapping() returns nested tuples whose depth mirrors the
    geometry type: a Polygon ring is ((x, y), ...), a Polygon with holes adds one more
    level, a MultiPolygon adds yet another. The base case is a flat (x, y) pair.
    """
    if isinstance(coords[0], (int, float)):
        return tuple(round(c, _COORD_PRECISION) for c in coords)
    return tuple(_round_coords(c) for c in coords)


def _extract_properties(props: dict) -> dict:
    return {
        GeoJsonProp.LEVEL: ADMIN_LEVEL_NAMES[props[RAW_LEVEL]],
        GeoJsonProp.NAME: props[RAW_NAME].strip() or None,
        GeoJsonProp.DISTRICT_CODE: props.get(RAW_DISTRICT) or None,
        GeoJsonProp.CODE: int(props[RAW_CODE].strip())
        if props[RAW_CODE].strip()
        else None,
    }

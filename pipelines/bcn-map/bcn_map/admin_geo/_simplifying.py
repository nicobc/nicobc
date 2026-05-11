import json
import logging

import topojson

from bcn_map.enums.geojson import GeoJsonKey

logger = logging.getLogger(__name__)

# 1 degree latitude ≈ 111,320 m at Barcelona's latitude
_METRES_PER_DEGREE = 111_320


def simplify(collection: dict, tolerance_m: float) -> dict:
    """Simplify geometries using topology-aware Douglas-Peucker.

    Uses topojson rather than per-feature Shapely simplification to preserve
    shared boundaries between adjacent polygons — per-feature simplification
    produces slivers where adjacent features simplify their shared edge to
    different vertices.
    """
    topo = topojson.Topology(collection, prequantize=False)
    simplified = topo.toposimplify(tolerance_m / _METRES_PER_DEGREE)
    assert simplified is not None, (
        "toposimplify returned None — topology may be malformed"
    )
    geojson_str = simplified.to_geojson()
    result = json.loads(geojson_str)  # type: ignore[arg-type]  # topojson has no stubs; to_geojson() always returns str
    logger.info(
        f"Simplified {len(collection[GeoJsonKey.FEATURES]):,} features at {tolerance_m}m tolerance"
    )
    return result

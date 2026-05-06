"""
Build the processed Barcelona administrative boundaries GeoJSON for map use.

Reads the raw Ajuntament de Barcelona administrative units file (EPSG:25831),
filters to the two layers needed for the map, reprojects to WGS84, simplifies
geometries, and writes a lightweight GeoJSON suitable for committing to the repo.

Input:  data/bcn/raw/0301100100_UNITATS_ADM_POLIGONS.json  (gitignored, ~22 MB)
Output: data/bcn/processed/bcn-admin.geojson               (committed, target <200 KB)

Layers extracted:
  ADM_01_PL — Municipality boundary (1 polygon)  → city outline and H3 coverage mask
  ADM_02_PL — District boundaries  (10 polygons) → visual reference layer on map

Run from repo root:
    uv run --project services/bcn-map build-admin-geo
"""

import json
import os

from pyproj import Transformer
from shapely.geometry import mapping, shape
from shapely.ops import transform

RAW = "data/bcn/raw/0301100100_UNITATS_ADM_POLIGONS.json"
OUTPUT = "data/bcn/processed/bcn-admin.geojson"
LEVELS = {"ADM_01_PL", "ADM_02_PL"}
TOLERANCE = 10  # metres — Douglas-Peucker simplification tolerance


def reproject_to_wgs84(geometry: dict) -> dict:
    """Reproject a GeoJSON geometry from EPSG:25831 to WGS84 (EPSG:4326).

    Args:
        geometry: GeoJSON geometry dict in EPSG:25831 (ETRS89 / UTM zone 31N).

    Returns:
        New GeoJSON geometry dict with WGS84 lon/lat coordinates.
    """
    transformer = Transformer.from_crs("EPSG:25831", "EPSG:4326", always_xy=True)
    shapely_geom = shape(geometry)
    reprojected = transform(transformer.transform, shapely_geom)
    return mapping(reprojected)


def simplify_geometry(geometry: dict, tolerance_deg: float) -> dict:
    """Simplify a GeoJSON geometry using Douglas-Peucker.

    Args:
        geometry: GeoJSON geometry dict in WGS84 coordinates.
        tolerance_deg: Simplification tolerance in degrees.

    Returns:
        Simplified GeoJSON geometry dict.
    """
    simplified = shape(geometry).simplify(tolerance_deg, preserve_topology=True)
    return mapping(simplified)


def extract_properties(props: dict) -> dict:
    """Extract and rename the subset of properties needed by the frontend.

    Args:
        props: Raw properties dict from the source GeoJSON feature.

    Returns:
        Minimal properties dict with snake_case keys.
    """
    return {
        "nivell": props["NIVELL"],
        "nom": props["NOM"],
        "districte": props.get("DISTRICTE") or None,
        "codi_ua": props["CODI_UA"],
    }


def main():
    """Read raw admin units, filter, reproject, simplify, and write output."""
    if not os.path.exists(RAW):
        raise FileNotFoundError(
            f"Raw file not found: {RAW}\n"
            "Run from repo root with the raw data in place."
        )

    print(f"Reading {RAW} ...")
    with open(RAW, encoding="utf-8") as f:
        data = json.load(f)

    all_features = data["features"]
    features = [f for f in all_features if f["properties"]["NIVELL"] in LEVELS]
    print(f"Extracted {len(features)} features from {len(all_features)} total")

    # Convert TOLERANCE from metres to approximate degrees at Barcelona's latitude.
    # 1 degree latitude ≈ 111,320 m; close enough for Douglas-Peucker on WGS84 coords.
    tolerance_deg = TOLERANCE / 111_320

    output_features = []
    for f in features:
        geom = reproject_to_wgs84(f["geometry"])
        geom = simplify_geometry(geom, tolerance_deg)
        output_features.append({
            "type": "Feature",
            "properties": extract_properties(f["properties"]),
            "geometry": geom,
        })

    output = {"type": "FeatureCollection", "features": output_features}

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, separators=(",", ":"), ensure_ascii=False)

    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"Written → {OUTPUT} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()

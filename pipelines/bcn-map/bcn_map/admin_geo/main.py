import logging

from bcn_map.admin_geo._projecting import project
from bcn_map.admin_geo._reading import read_features
from bcn_map.admin_geo._simplifying import simplify
from bcn_map.admin_geo._writing import write
from bcn_map.admin_geo.constants.paths import ADMIN_BOUNDARIES_OUTPUT, ADMIN_BOUNDARIES_RAW

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

TOLERANCE = 10  # metres


def main() -> None:
    logger.info("Starting admin boundaries pipeline")
    features = read_features(ADMIN_BOUNDARIES_RAW)
    projection = project(features)
    geojson = simplify(projection, TOLERANCE)
    write(geojson, ADMIN_BOUNDARIES_OUTPUT)
    logger.info("Done")

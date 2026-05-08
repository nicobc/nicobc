import logging

from bcn_map.metrics._computing import compute
from bcn_map.metrics._pivoting import pivot
from bcn_map.metrics._reading import read_all
from bcn_map.metrics._writing import write
from bcn_map.metrics.constants.paths import CADASTRAL_OWNERSHIP_OUTPUT, CADASTRAL_OWNERSHIP_RAW_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Starting cadastral ownership metrics pipeline")
    df = read_all(CADASTRAL_OWNERSHIP_RAW_DIR).pipe(pivot).pipe(compute)
    write(df, CADASTRAL_OWNERSHIP_OUTPUT)
    logger.info("Done")

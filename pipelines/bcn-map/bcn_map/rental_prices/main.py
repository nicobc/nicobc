import logging

from bcn_map.rental_prices._parsing import parse_prices
from bcn_map.rental_prices._reading import load_admin_boundaries, read_prices
from bcn_map.rental_prices._summarizing import extract_neighborhood_names, summarize
from bcn_map.rental_prices._writing import write
from bcn_map.rental_prices.constants.paths import RENTAL_INSIGHTS_OUTPUT, RENTAL_PRICES_OUTPUT, RENTAL_PRICES_RAW

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Starting rental prices pipeline")
    raw = read_prices(RENTAL_PRICES_RAW)
    records = parse_prices(raw)
    write(records, RENTAL_PRICES_OUTPUT)
    geojson = load_admin_boundaries()
    names = extract_neighborhood_names(geojson)
    insights = summarize(records, names)
    write(insights, RENTAL_INSIGHTS_OUTPUT)
    logger.info("Done")

import logging

from bcn_map.rental_prices._reading import read_prices
from bcn_map.rental_prices._summarizing import summarize
from bcn_map.rental_prices._writing import write
from bcn_map.rental_prices.constants.paths import RENTAL_INSIGHTS_OUTPUT, RENTAL_PRICES_OUTPUT, RENTAL_PRICES_RAW

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Starting rental prices pipeline")
    records = read_prices(RENTAL_PRICES_RAW)
    write(records, RENTAL_PRICES_OUTPUT)
    insights = summarize(records)
    write(insights, RENTAL_INSIGHTS_OUTPUT)
    logger.info("Done")

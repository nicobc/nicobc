from bcn_map.rental_prices._parsing import parse_prices


def test_parse_prices(
    input_raw_prices: list[list], expected_records_prices: list[dict]
) -> None:
    actual_records = parse_prices(input_raw_prices)
    assert actual_records == expected_records_prices

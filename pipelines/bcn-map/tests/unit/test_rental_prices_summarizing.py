from bcn_map.rental_prices._summarizing import extract_neighborhood_names, summarize


def test_extract_neighborhood_names(
    input_geojson: dict, expected_neighborhood_names: dict[int, str]
) -> None:
    actual_names = extract_neighborhood_names(input_geojson)
    assert actual_names == expected_neighborhood_names


def test_summarize(
    records_summarize: list[dict],
    names_summarize: dict[int, str],
    expected_summary: dict,
) -> None:
    actual_summary = summarize(records_summarize, names_summarize)
    assert actual_summary == expected_summary

from bcn_map.admin_geo._simplifying import simplify


def test_simplify(
    projected_eixample_collection: dict, expected_simplified_collection: dict
) -> None:
    actual_collection = simplify(projected_eixample_collection, tolerance_m=10)
    assert actual_collection == expected_simplified_collection

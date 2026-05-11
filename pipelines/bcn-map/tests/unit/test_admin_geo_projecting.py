from bcn_map.admin_geo._projecting import project


def test_project(
    raw_eixample_features: list[dict], projected_eixample_collection: dict
) -> None:
    actual_collection = project(raw_eixample_features)
    assert actual_collection == projected_eixample_collection

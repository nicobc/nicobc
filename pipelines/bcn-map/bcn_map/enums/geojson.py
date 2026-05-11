from enum import StrEnum, auto


class GeoJsonKey(StrEnum):
    TYPE = auto()
    FEATURES = auto()
    PROPERTIES = auto()
    GEOMETRY = auto()
    COORDINATES = auto()


class GeoJsonProp(StrEnum):
    LEVEL = auto()
    NAME = auto()
    CODE = auto()
    DISTRICT_CODE = auto()

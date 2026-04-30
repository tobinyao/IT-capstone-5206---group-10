"""
Risk normalization and mapping utilities for model-ready inputs.

This module is intentionally independent from the existing risk_model.py so it
can be added as a standalone PR without changing current backend behaviour.
"""

DEFAULT_NORMALIZATION = {
    "max_slope_degrees": 45,
    "max_fuel_age_years": 30,
    "score_min": 0,
    "score_max": 100,
}

FUEL_TYPE_RISK = {
    "Tall closed forest": 100,
    "Closed forest": 96,
    "Pine plantation": 94,
    "Tall open forest": 92,
    "Tall shrubland": 88,
    "Open forest": 86,
    "Woodland with shrubby understory": 84,
    "Shrubland": 82,
    "Low woodland": 67,
    "Grassland": 62,
    "Sedgeland": 58,
    "Cropland": 50,
    "Wetland": 35,
    "Sparse grassland": 34,
    "Built-up": 26,
    "Bare ground": 12,
    "Water": 5,
}

GRANITE_INFLUENCE = {
    "none": 0,
    "low": 25,
    "medium": 50,
    "high": 75,
    "very_high": 100,
}

HERITAGE_TYPE_MATERIAL_RISK = {
    "Modified tree / timber / wooden structure": 95,
    "Rock art / painting / engraving / rock shelter": 86,
    "Burial / grave / cemetery": 76,
    "Ceremonial / creation / dreaming / mythological place": 72,
    "General built heritage": 72,
    "Midden / organic deposit": 62,
    "Camp / historical place / water source": 60,
    "Artefact scatter / quarry / grinding area / sub-surface material": 52,
    "Brick / stone / masonry / concrete": 46,
}

BURN_CONTEXT_RISK = {
    "outside_burn_option": 0,
    "near_burn_option": 0,
    "inside_burn_option": 100,
    "planned_burn_overlap": 100,
    "outside": 0,
    "inside": 100,
}


def clamp_score(value, minimum=0, maximum=100):
    """Clamp a numeric value to the model risk score range."""
    return round(min(max(float(value), minimum), maximum), 2)


def normalize_category_key(value):
    """Normalize category labels so mappings tolerate spaces and case changes."""
    return str(value).strip().lower().replace(" ", "_")


def map_category_to_score(value, mapping, default=50):
    """Map a categorical source value to a 0-100 risk score."""
    if value is None:
        return default

    if str(value).strip() in mapping:
        return mapping[str(value).strip()]

    normalized_value = normalize_category_key(value)
    for key, score in mapping.items():
        if normalize_category_key(key) == normalized_value:
            return score

    return default


def slope_to_risk(slope_value, max_slope_degrees=45):
    """Convert slope degrees to Slope Risk using the SiteAssessment model."""
    if slope_value is None:
        return 0

    slope = float(slope_value)
    if slope <= 5:
        return 12
    if slope <= 15:
        return clamp_score(12 + (slope - 5) * 3.8)
    if slope <= 25:
        return clamp_score(50 + (slope - 15) * 5)
    return 100


def fuel_to_risk(fuel_value, max_fuel_age_years=30, fuel_type_mapping=None):
    """
    Convert fuel score or fuel type to Fuel Risk.

    Numeric values are treated as an existing 0-100 score. String values are
    treated as SiteAssessment fuel type categories.
    """
    if fuel_value is None:
        return 0

    if isinstance(fuel_value, (int, float)):
        return clamp_score(fuel_value)

    mapping = fuel_type_mapping or FUEL_TYPE_RISK
    return clamp_score(map_category_to_score(fuel_value, mapping))


def granite_to_influence(granite_value, granite_mapping=None):
    """
    Convert granite index or geology category to Granite Influence.

    Numeric values are treated as an existing 0-100 granite index. String values
    are treated as mapped geology influence categories.
    """
    if granite_value is None:
        return 0

    if isinstance(granite_value, (int, float)):
        return clamp_score(granite_value)

    mapping = granite_mapping or GRANITE_INFLUENCE
    return clamp_score(map_category_to_score(granite_value, mapping))


def heritage_type_to_material_risk(heritage_type, heritage_type_mapping=None):
    """Convert heritage type or material category to material sensitivity risk."""
    mapping = heritage_type_mapping or HERITAGE_TYPE_MATERIAL_RISK
    return clamp_score(map_category_to_score(heritage_type, mapping))


def burn_context_to_risk(burn_context, burn_context_mapping=None):
    """
    Convert burn option overlap or burn management context to Burn Context risk.

    Numeric values are treated as an existing 0-100 context score. Boolean
    values follow SiteAssessment: inside overlap is 100, outside is 0.
    """
    if burn_context is None:
        return 0

    if isinstance(burn_context, bool):
        return 100 if burn_context else 0

    if isinstance(burn_context, (int, float)):
        return clamp_score(burn_context)

    mapping = burn_context_mapping or BURN_CONTEXT_RISK
    return clamp_score(map_category_to_score(burn_context, mapping))


def standardize_risk_inputs(data, config=None):
    """
    Convert raw heritage/environmental fields into model-ready risk scores.

    Supported raw input keys:
    - slope
    - fuelRisk, fuelType, or legacy fuelAge
    - graniteIndex or graniteInfo
    - heritageType
    - burnContext or burnOptionOverlap
    """
    config = config or {}
    normalization = {**DEFAULT_NORMALIZATION, **config.get("normalization", {})}
    mappings = config.get("risk_mappings", {})

    fuel_value = data.get("fuelRisk", data.get("fuelType", data.get("fuelAge")))
    granite_value = data.get("graniteIndex", data.get("graniteInfo"))
    burn_value = data.get("burnContext", data.get("burnOptionOverlap"))

    return {
        "slopeRisk": slope_to_risk(
            data.get("slope"),
            normalization["max_slope_degrees"],
        ),
        "fuelRisk": fuel_to_risk(
            fuel_value,
            normalization["max_fuel_age_years"],
            mappings.get("fuel_type_risk"),
        ),
        "graniteInfluence": granite_to_influence(
            granite_value,
            mappings.get("granite_influence"),
        ),
        "heritageTypeRisk": heritage_type_to_material_risk(
            data.get("heritageType"),
            mappings.get("heritage_type_material_risk"),
        ),
        "burnContext": burn_context_to_risk(
            burn_value,
            mappings.get("burn_context_risk"),
        ),
    }

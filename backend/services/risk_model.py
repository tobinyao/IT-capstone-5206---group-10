try:
    from .risk_normalization import (
        burn_context_to_risk,
        fuel_to_risk,
        heritage_type_to_material_risk,
        slope_to_risk,
    )
except ImportError:
    from risk_normalization import (
        burn_context_to_risk,
        fuel_to_risk,
        heritage_type_to_material_risk,
        slope_to_risk,
    )


def score_slope(slope):
    """Return SiteAssessment-compatible Slope Risk on a 0-100 scale."""
    return slope_to_risk(slope)


def score_fuel(fuel_type_or_score):
    """Return SiteAssessment-compatible Fuel Risk on a 0-100 scale."""
    return fuel_to_risk(fuel_type_or_score)


def score_fuel_age(fuel_age):
    """
    Backward-compatible alias for older callers.

    Numeric values are treated as already-normalized 0-100 Fuel Risk scores,
    matching risk_normalization.fuel_to_risk().
    """
    return fuel_to_risk(fuel_age)


def score_heritage_type(heritage_type_or_score):
    """Return SiteAssessment-compatible Heritage Type Risk on a 0-100 scale."""
    return heritage_type_to_material_risk(heritage_type_or_score)


def score_burn_context(burn_context):
    """Return SiteAssessment-compatible Burn Context score on a 0-100 scale."""
    return burn_context_to_risk(burn_context)


def calculate_risk(slope, fuel_type, heritage_type, burn_context=False):
    """
    Calculate the same weighted vulnerability score used by SiteAssessment.tsx.

    Formula:
      fuel * 0.45 + slope * 0.25 + heritage type * 0.25 + burn context * 0.05
    """
    slope_score = score_slope(slope)
    fuel_score = score_fuel(fuel_type)
    heritage_score = score_heritage_type(heritage_type)
    burn_score = score_burn_context(burn_context)

    total_score = round(
        fuel_score * 0.45
        + slope_score * 0.25
        + heritage_score * 0.25
        + burn_score * 0.05
    )

    if total_score >= 64.2:
        risk_level = "High"
    elif total_score >= 48.3:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "riskLevel": risk_level,
        "score": total_score,
        "breakdown": {
            "fuelRisk": fuel_score,
            "slopeRisk": slope_score,
            "heritageTypeRisk": heritage_score,
            "burnContext": burn_score,
        },
    }

def calculate_site_score(fuel_risk, slope_risk, heritage_risk, burn_context):
    """
    Calculate weighted score based on project model
    """

    score = (
        fuel_risk * 0.45 +
        slope_risk * 0.25 +
        heritage_risk * 0.25 +
        burn_context * 0.05
    )

    return round(score)


def get_risk_level(score):
    """
    Convert score to risk level
    """

    if score >= 64.2:
        return "High"
    elif score >= 48.3:
        return "Medium"
    return "Low"

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

    return round(score, 2)


def get_risk_level(score):
    """
    Convert score to risk level
    """

    if score < 40:
        return "Low"
    elif score < 70:
        return "Medium"
    else:
        return "High"
def score_slope(slope):
    if slope <= 10:
        return 1
    elif slope <= 20:
        return 2
    elif slope <= 30:
        return 3
    return 4


def score_fuel_age(fuel_age):
    if fuel_age <= 5:
        return 1
    elif fuel_age <= 10:
        return 2
    elif fuel_age <= 20:
        return 3
    return 4

def score_granite(granite_index):
    if granite_index <= 25:
        return 1
    elif granite_index <= 50:
        return 2
    elif granite_index <= 75:
        return 3
    return 4

def calculate_risk(slope, fuel_age, granite_index):
    total_score = (
        score_slope(slope) +
        score_fuel_age(fuel_age) +
        score_granite(granite_index)
    )

    if total_score <= 5:
        risk_level = "Low"
    elif total_score <= 8:
        risk_level = "Medium"
    else:
        risk_level = "High"

    return {
        "riskLevel": risk_level,
        "score": total_score
    }
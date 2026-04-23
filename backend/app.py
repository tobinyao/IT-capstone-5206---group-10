from flask import Flask, request, jsonify
from flask_cors import CORS
from services.risk_model import calculate_risk
from services.site_assessment import calculate_site_score, get_risk_level

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend is running"})

@app.route("/api/risk-assessment", methods=["POST"])
def risk_assessment():
    data = request.get_json()

    slope = data.get("slope", 0)
    fuel_age = data.get("fuelAge", 0)
    granite_index = data.get("graniteIndex", 0)

    result = calculate_risk(slope, fuel_age, granite_index)
    return jsonify(result)

@app.route("/api/site-assessment", methods=["POST"])
def site_assessment():
    data = request.get_json()

    fuel = data.get("fuelRisk", 0)
    slope = data.get("slopeRisk", 0)
    heritage = data.get("heritageTypeRisk", 0)
    burn = data.get("burnContext", 0)

    score = calculate_site_score(fuel, slope, heritage, burn)
    risk_level = get_risk_level(score)

    return jsonify({
        "score": score,
        "riskLevel": risk_level,
        "breakdown": {
            "fuelRisk": fuel,
            "slopeRisk": slope,
            "heritageTypeRisk": heritage,
            "burnContext": burn
        }
    })

if __name__ == "__main__":
    app.run(debug=True)
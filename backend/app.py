from flask import Flask, jsonify, request
from flask_cors import CORS

from routes.heritage_routes import heritage_bp
from services.site_assessment import calculate_site_score, get_risk_level

from pathlib import Path
import json

app = Flask(__name__)
CORS(app)
app.register_blueprint(heritage_bp)

BASE_DIR = Path(__file__).resolve().parent
METADATA_FILE = BASE_DIR / "data" / "metadata.json"

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend is running"})

@app.route("/api/metadata", methods=["GET"])
def get_metadata():
    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        return jsonify(metadata)
    except FileNotFoundError:
        return jsonify({"error": "metadata.json not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "metadata.json is invalid"}), 500

def validate_score_input(data, field_name):
    if field_name not in data:
        return f"{field_name} is required"

    value = data[field_name]

    if not isinstance(value, (int, float)):
        return f"{field_name} must be a number"

    if value < 0 or value > 100:
        return f"{field_name} must be between 0 and 100"

    return None

@app.route("/api/site-assessment", methods=["POST"])
def site_assessment():
    data = request.get_json()

    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    required_fields = [
        "fuelRisk",
        "slopeRisk",
        "heritageTypeRisk",
        "burnContext"
    ]

    for field in required_fields:
        error = validate_score_input(data, field)
        if error:
            return jsonify({"error": error}), 400

    fuel = data["fuelRisk"]
    slope = data["slopeRisk"]
    heritage = data["heritageTypeRisk"]
    burn = data["burnContext"]

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

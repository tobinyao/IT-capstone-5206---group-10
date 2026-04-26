from flask import Flask, jsonify, request
from flask_cors import CORS

from services.risk_model import calculate_risk
from services.site_assessment import calculate_site_score, get_risk_level

from pathlib import Path
import json

app = Flask(__name__)
CORS(app)

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
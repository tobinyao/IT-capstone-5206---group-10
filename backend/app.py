from flask import Flask, request, jsonify
from flask_cors import CORS
from services.risk_model import calculate_risk

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

if __name__ == "__main__":
    app.run(debug=True)
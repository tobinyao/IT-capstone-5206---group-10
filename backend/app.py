from flask import Flask, jsonify
from flask_cors import CORS
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

if __name__ == "__main__":
    app.run(debug=True)
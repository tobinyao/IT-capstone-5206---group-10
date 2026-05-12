from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from services.db import get_db_connection
import re
import secrets


auth_bp = Blueprint("auth", __name__, url_prefix="/api")


def is_valid_email(email):
    email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(email_pattern, email) is not None


def create_demo_token(user_id):
    return f"demo-token-{user_id}-{secrets.token_urlsafe(16)}"


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not password:
        return jsonify({"error": "Password is required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    password_hash = generate_password_hash(password)

    try:
        conn = get_db_connection()

        existing_user = conn.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,),
        ).fetchone()

        if existing_user:
            conn.close()
            return jsonify({"error": "Email is already registered"}), 409

        cursor = conn.execute(
            """
            INSERT INTO users (email, password_hash, role)
            VALUES (?, ?, ?)
            """,
            (email, password_hash, "user"),
        )

        conn.commit()
        user_id = cursor.lastrowid
        conn.close()

        return jsonify({
            "message": "User registered successfully",
            "user": {
                "id": user_id,
                "email": email,
                "role": "user"
            }
        }), 201

    except Exception as e:
        return jsonify({
            "error": "Registration failed",
            "details": str(e)
        }), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not password:
        return jsonify({"error": "Password is required"}), 400

    try:
        conn = get_db_connection()

        user = conn.execute(
            """
            SELECT id, email, password_hash, role
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

        if user is None:
            conn.close()
            return jsonify({"error": "Invalid email or password"}), 401

        if not user["password_hash"]:
            conn.close()
            return jsonify({"error": "This account does not have a password set"}), 401

        if not check_password_hash(user["password_hash"], password):
            conn.close()
            return jsonify({"error": "Invalid email or password"}), 401

        conn.execute(
            "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
            (user["id"],),
        )
        conn.commit()
        conn.close()

        token = create_demo_token(user["id"])

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Login failed",
            "details": str(e)
        }), 500
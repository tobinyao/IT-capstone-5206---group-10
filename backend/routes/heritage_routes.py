from flask import Blueprint, jsonify

from services.data_loader import find_record_by_id, load_json_data


heritage_bp = Blueprint("heritage", __name__, url_prefix="/api")


@heritage_bp.route("/heritage", methods=["GET"])
@heritage_bp.route("/sites", methods=["GET"])
def get_heritage_sites():
    try:
        sites = load_json_data("heritage_sites.json")
    except FileNotFoundError:
        return jsonify({"error": "heritage_sites.json not found"}), 404
    except ValueError:
        return jsonify({"error": "heritage_sites.json is invalid"}), 500

    return jsonify({
        "count": len(sites),
        "sites": sites,
    })


@heritage_bp.route("/heritage/<site_id>", methods=["GET"])
@heritage_bp.route("/sites/<site_id>", methods=["GET"])
def get_heritage_site(site_id):
    try:
        sites = load_json_data("heritage_sites.json")
    except FileNotFoundError:
        return jsonify({"error": "heritage_sites.json not found"}), 404
    except ValueError:
        return jsonify({"error": "heritage_sites.json is invalid"}), 500

    site = find_record_by_id(sites, site_id)
    if site is None:
        return jsonify({"error": "heritage site not found"}), 404

    return jsonify(site)

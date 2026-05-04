from flask import Blueprint, jsonify

from services.data_loader import (
    get_geojson_layer,
    get_heritage_site_by_id,
    get_heritage_sites as load_heritage_sites_from_db,
    get_processed_metadata,
)


heritage_bp = Blueprint("heritage", __name__, url_prefix="/api")


@heritage_bp.route("/heritage", methods=["GET"])
@heritage_bp.route("/sites", methods=["GET"])
def get_heritage_sites():
    try:
        sites = load_heritage_sites_from_db()
    except Exception as error:
        return jsonify({"error": f"could not load heritage sites: {error}"}), 500

    return jsonify({
        "count": len(sites),
        "sites": sites,
    })


@heritage_bp.route("/heritage/<site_id>", methods=["GET"])
@heritage_bp.route("/sites/<site_id>", methods=["GET"])
def get_heritage_site(site_id):
    try:
        site = get_heritage_site_by_id(site_id)
    except Exception as error:
        return jsonify({"error": f"could not load heritage site: {error}"}), 500

    if site is None:
        return jsonify({"error": "heritage site not found"}), 404

    return jsonify(site)


@heritage_bp.route("/layers/heritage", methods=["GET"])
def get_heritage_layer():
    return jsonify(get_geojson_layer("heritage_all"))


@heritage_bp.route("/layers/burn-options", methods=["GET"])
@heritage_bp.route("/layers/burn_options", methods=["GET"])
def get_burn_options_layer():
    return jsonify(get_geojson_layer("burn_options"))


@heritage_bp.route("/layers/granite", methods=["GET"])
def get_granite_layer():
    return jsonify(get_geojson_layer("granite"))


@heritage_bp.route("/processed-metadata", methods=["GET"])
def get_processed_metadata_route():
    metadata = get_processed_metadata()
    if metadata is None:
        return jsonify({"error": "processed metadata not found"}), 404

    return jsonify(metadata)

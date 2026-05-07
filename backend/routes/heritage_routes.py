from flask import Blueprint, jsonify, request

from services.data_loader import (
    create_heritage_site,
    delete_user_heritage_site,
    get_geojson_layer,
    get_heritage_registry_layer,
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


@heritage_bp.route("/heritage", methods=["POST"])
@heritage_bp.route("/sites", methods=["POST"])
def add_heritage_site():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    try:
        site, feature = create_heritage_site(data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        return jsonify({"error": f"could not create heritage site: {error}"}), 500

    return jsonify({
        "site": site,
        "feature": feature,
    }), 201


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


@heritage_bp.route("/heritage/<site_id>", methods=["DELETE"])
@heritage_bp.route("/sites/<site_id>", methods=["DELETE"])
def delete_heritage_site(site_id):
    try:
        result = delete_user_heritage_site(site_id)
    except Exception as error:
        return jsonify({"error": f"could not delete heritage site: {error}"}), 500

    if result == "not_found":
        return jsonify({"error": "heritage site not found"}), 404
    if result == "not_user_site":
        return jsonify({"error": "only user-submitted heritage sites can be deleted"}), 403

    return jsonify({"deleted": True, "id": site_id})


@heritage_bp.route("/heritage-registry", methods=["GET"])
def get_heritage_registry():
    return jsonify(get_heritage_registry_layer())


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

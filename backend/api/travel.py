"""Travel planning CRUD — trips, packing items, saved searches, flight search."""
from __future__ import annotations

import re
from datetime import datetime

from flask import Blueprint, request, jsonify
from backend.db import query, execute, execute_returning, log_activity

travel_bp = Blueprint("travel", __name__)

# ── Trips ────────────────────────────────────────────────────────────────────

@travel_bp.route("/api/travel/trips", methods=["GET"])
def list_trips():
    rows = query(
        "SELECT id, destination, start_date::text, end_date::text, notes, status, airports, created_at, updated_at "
        "FROM trips ORDER BY start_date ASC NULLS LAST"
    )
    return jsonify(rows)


@travel_bp.route("/api/travel/trips", methods=["POST"])
def create_trip():
    data = request.get_json()
    destination = data.get("destination", "").strip()
    if not destination:
        return jsonify({"error": "Destination is required"}), 400

    row = execute_returning(
        "INSERT INTO trips (destination, start_date, end_date, notes, status, airports) "
        "VALUES (%s, %s, %s, %s, %s, %s) "
        "RETURNING id, destination, start_date::text, end_date::text, notes, status, airports, created_at, updated_at",
        (
            destination,
            data.get("start_date"),
            data.get("end_date"),
            data.get("notes", ""),
            data.get("status", "planning"),
            data.get("airports", "EWR"),
        ),
    )
    log_activity("travel", "trip_created", f"Created trip to {destination}")
    return jsonify(row), 201


@travel_bp.route("/api/travel/trips/<int:trip_id>", methods=["PUT"])
def update_trip(trip_id):
    existing = query("SELECT id FROM trips WHERE id = %s", (trip_id,))
    if not existing:
        return jsonify({"error": "Trip not found"}), 404

    data = request.get_json()
    updates = []
    params = []

    for field in ("destination", "start_date", "end_date", "notes", "status", "airports"):
        if field in data:
            updates.append(f"{field} = %s")
            params.append(data[field])

    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    updates.append("updated_at = NOW()")
    params.append(trip_id)

    row = execute_returning(
        f"UPDATE trips SET {', '.join(updates)} WHERE id = %s "
        "RETURNING id, destination, start_date::text, end_date::text, notes, status, airports, created_at, updated_at",
        params,
    )
    return jsonify(row)


@travel_bp.route("/api/travel/trips/<int:trip_id>", methods=["DELETE"])
def delete_trip(trip_id):
    existing = query("SELECT destination FROM trips WHERE id = %s", (trip_id,))
    if not existing:
        return jsonify({"error": "Trip not found"}), 404

    execute("DELETE FROM trips WHERE id = %s", (trip_id,))
    log_activity("travel", "trip_deleted", f"Deleted trip to {existing[0]['destination']}")
    return jsonify({"deleted": trip_id})


# ── Flight Search (SerpAPI Google Flights) ───────────────────────────────────

IATA_RE = re.compile(r"^[A-Z]{3}$")


@travel_bp.route("/api/travel/flights", methods=["GET"])
def search_flights():
    """Proxy flight search to SerpAPI Google Flights.

    GET /api/travel/flights?origin=EWR&destination=LAX&date=2026-04-10&return=2026-04-17&adults=3
    """
    origin = (request.args.get("origin") or "EWR").upper()
    destination = (request.args.get("destination") or "").upper()
    date = request.args.get("date", "")
    return_date = request.args.get("return", "")
    adults = int(request.args.get("adults", "1"))

    if not destination or not IATA_RE.match(destination):
        return jsonify({"error": "Valid 3-letter destination IATA code required"}), 400
    if not IATA_RE.match(origin):
        return jsonify({"error": "Valid 3-letter origin IATA code required"}), 400
    if not date:
        return jsonify({"error": "Departure date required (date param)"}), 400

    try:
        from backend.services.flight_search_service import search_flights as serp_search
        flights = serp_search(
            origin=origin,
            destination=destination,
            departure_date=date,
            return_date=return_date or None,
            adults=adults,
        )
        return jsonify({
            "flights": flights,
            "searchedAt": datetime.utcnow().isoformat() + "Z",
            "origin": origin,
            "destination": destination,
        })
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Flight search failed: {str(e)}"}), 502


# ── Hotel Search (SerpAPI Google Hotels) ─────────────────────────────────────


@travel_bp.route("/api/travel/hotels", methods=["GET"])
def search_hotels():
    """Proxy hotel search to SerpAPI Google Hotels.

    GET /api/travel/hotels?destination=Cancun&check_in=2026-04-15&check_out=2026-04-20&adults=3
    """
    destination = (request.args.get("destination") or "").strip()
    check_in = request.args.get("check_in", "")
    check_out = request.args.get("check_out", "")
    adults = int(request.args.get("adults", "2"))

    if not destination:
        return jsonify({"error": "Destination is required"}), 400
    if not check_in or not check_out:
        return jsonify({"error": "check_in and check_out dates are required"}), 400

    try:
        from backend.services.hotel_search_service import search_hotels as serp_search
        hotels = serp_search(
            destination=destination,
            check_in=check_in,
            check_out=check_out,
            adults=adults,
        )
        return jsonify({
            "hotels": hotels,
            "searchedAt": datetime.utcnow().isoformat() + "Z",
            "destination": destination,
        })
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Hotel search failed: {str(e)}"}), 502


# ── Packing Items ────────────────────────────────────────────────────────────

@travel_bp.route("/api/travel/trips/<int:trip_id>/packing", methods=["GET"])
def list_packing(trip_id):
    rows = query(
        "SELECT id, trip_id, category, item, packed, created_at "
        "FROM packing_items WHERE trip_id = %s ORDER BY category, id",
        (trip_id,),
    )
    return jsonify(rows)


@travel_bp.route("/api/travel/trips/<int:trip_id>/packing", methods=["POST"])
def add_packing_item(trip_id):
    data = request.get_json()
    item_text = data.get("item", "").strip()
    if not item_text:
        return jsonify({"error": "Item is required"}), 400

    row = execute_returning(
        "INSERT INTO packing_items (trip_id, category, item) VALUES (%s, %s, %s) "
        "RETURNING id, trip_id, category, item, packed, created_at",
        (trip_id, data.get("category", "essentials"), item_text),
    )
    return jsonify(row), 201


@travel_bp.route("/api/travel/packing/<int:item_id>", methods=["PUT"])
def update_packing_item(item_id):
    existing = query("SELECT id FROM packing_items WHERE id = %s", (item_id,))
    if not existing:
        return jsonify({"error": "Item not found"}), 404

    data = request.get_json()
    updates = []
    params = []

    if "packed" in data:
        updates.append("packed = %s")
        params.append(data["packed"])
    if "item" in data:
        updates.append("item = %s")
        params.append(data["item"])
    if "category" in data:
        updates.append("category = %s")
        params.append(data["category"])

    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    params.append(item_id)
    row = execute_returning(
        f"UPDATE packing_items SET {', '.join(updates)} WHERE id = %s "
        "RETURNING id, trip_id, category, item, packed, created_at",
        params,
    )
    return jsonify(row)


@travel_bp.route("/api/travel/packing/<int:item_id>", methods=["DELETE"])
def delete_packing_item(item_id):
    existing = query("SELECT id FROM packing_items WHERE id = %s", (item_id,))
    if not existing:
        return jsonify({"error": "Item not found"}), 404

    execute("DELETE FROM packing_items WHERE id = %s", (item_id,))
    return jsonify({"deleted": item_id})


@travel_bp.route("/api/travel/trips/<int:trip_id>/packing/generate", methods=["POST"])
def generate_packing(trip_id):
    """Auto-generate a default packing list by category (family context: pregnant Carolyn, 4yo Sebby, Jax the dog)."""
    existing = query("SELECT id FROM trips WHERE id = %s", (trip_id,))
    if not existing:
        return jsonify({"error": "Trip not found"}), 404

    templates = {
        "essentials": [
            "Passports / IDs",
            "Wallet & credit cards",
            "Phone chargers",
            "Travel insurance docs",
            "Boarding passes / itinerary",
            "Cash / foreign currency",
        ],
        "clothing": [
            "T-shirts (5)",
            "Pants / shorts (3)",
            "Underwear (7)",
            "Socks (7 pairs)",
            "Jacket / hoodie",
            "Pajamas",
            "Swimsuits",
            "Comfortable walking shoes",
            "Sandals / flip-flops",
        ],
        "baby-kids": [
            "Sebby's clothes (5 outfits)",
            "Sebby's pajamas",
            "Sebby's shoes & sandals",
            "Snacks & sippy cup",
            "Favorite toys / books",
            "Car seat / booster",
            "Stroller",
            "Diapers & wipes (if needed)",
            "Kid sunscreen",
        ],
        "dog-supplies": [
            "Jax's food (portioned)",
            "Collapsible water bowl",
            "Leash & harness",
            "Poop bags",
            "Jax's bed / blanket",
            "Dog treats",
            "Vaccination records",
        ],
        "pregnancy": [
            "Prenatal vitamins",
            "Pregnancy pillow (travel-size)",
            "Comfortable maternity clothes",
            "Medical records / OB info",
            "Compression socks (for flying)",
            "Healthy snacks",
            "Water bottle",
        ],
        "toiletries": [
            "Toothbrushes & toothpaste",
            "Shampoo & conditioner",
            "Deodorant",
            "Sunscreen",
            "Medications",
            "First-aid kit",
            "Hand sanitizer",
            "Lip balm",
        ],
        "tech": [
            "Laptop & charger",
            "iPad / tablet",
            "Headphones",
            "Portable battery pack",
            "Camera",
            "Universal power adapter",
        ],
    }

    created = []
    for category, items in templates.items():
        for item_text in items:
            row = execute_returning(
                "INSERT INTO packing_items (trip_id, category, item) VALUES (%s, %s, %s) "
                "RETURNING id, trip_id, category, item, packed, created_at",
                (trip_id, category, item_text),
            )
            created.append(row)

    log_activity("travel", "packing_generated", f"Generated {len(created)} packing items for trip {trip_id}")
    return jsonify(created), 201


# ── Saved Searches ───────────────────────────────────────────────────────────

@travel_bp.route("/api/travel/searches", methods=["GET"])
def list_searches():
    search_type = request.args.get("type")
    if search_type:
        rows = query(
            "SELECT id, search_type, label, destination, url, metadata, trip_id, created_at "
            "FROM saved_searches WHERE search_type = %s ORDER BY created_at DESC",
            (search_type,),
        )
    else:
        rows = query(
            "SELECT id, search_type, label, destination, url, metadata, trip_id, created_at "
            "FROM saved_searches ORDER BY created_at DESC"
        )
    return jsonify(rows)


@travel_bp.route("/api/travel/searches", methods=["POST"])
def create_search():
    data = request.get_json()
    label = data.get("label", "").strip()
    search_type = data.get("search_type", "").strip()
    if not label or not search_type:
        return jsonify({"error": "label and search_type are required"}), 400

    import json
    row = execute_returning(
        "INSERT INTO saved_searches (search_type, label, destination, url, metadata, trip_id) "
        "VALUES (%s, %s, %s, %s, %s, %s) "
        "RETURNING id, search_type, label, destination, url, metadata, trip_id, created_at",
        (
            search_type,
            label,
            data.get("destination", ""),
            data.get("url", ""),
            json.dumps(data.get("metadata", {})),
            data.get("trip_id"),
        ),
    )
    return jsonify(row), 201


@travel_bp.route("/api/travel/searches/<int:search_id>", methods=["DELETE"])
def delete_search(search_id):
    existing = query("SELECT id FROM saved_searches WHERE id = %s", (search_id,))
    if not existing:
        return jsonify({"error": "Search not found"}), 404

    execute("DELETE FROM saved_searches WHERE id = %s", (search_id,))
    return jsonify({"deleted": search_id})

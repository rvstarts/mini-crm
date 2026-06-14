from flask import Blueprint, request, jsonify
from app.models import db, Journey, JourneyState, CommunicationLog, Campaign
from app.services.journey_engine import JourneyEngine
from datetime import datetime

bp = Blueprint('journeys', __name__)

@bp.route('/', methods=['GET'])
def get_journeys():
    journeys = Journey.query.order_by(Journey.updated_at.desc()).all()
    return jsonify([{
        "id": j.id,
        "name": j.name,
        "status": j.status,
        "created_at": j.created_at.isoformat(),
        "updated_at": j.updated_at.isoformat()
    } for j in journeys])

@bp.route('/<int:id>', methods=['GET'])
def get_journey(id):
    from app.models import Customer
    j = Journey.query.get_or_404(id)
    
    logs = db.session.query(CommunicationLog).join(Campaign, CommunicationLog.campaign_id == Campaign.id).filter(Campaign.name == j.name).order_by(CommunicationLog.timestamp.desc()).limit(50).all()
    
    timeline = []
    for log in logs:
        cust = Customer.query.get(log.customer_id) if log.customer_id else None
        timeline.append({
            "event": log.event_type,
            "timestamp": log.timestamp.isoformat(),
            "customer_name": cust.name if cust else 'Unknown',
            "channel": log.campaign.channel if log.campaign else 'Unknown'
        })
        
    return jsonify({
        "id": j.id,
        "name": j.name,
        "status": j.status,
        "nodes_json": j.nodes_json,
        "edges_json": j.edges_json,
        "analytics": {
            "customers_entered": j.customers_entered,
            "messages_sent": j.messages_sent,
            "messages_delivered": j.messages_delivered,
            "messages_opened": j.messages_opened,
            "messages_clicked": j.messages_clicked,
            "conversions": j.conversions,
            "revenue_generated": j.revenue_generated
        },
        "timeline": timeline,
        "created_at": j.created_at.isoformat(),
        "updated_at": j.updated_at.isoformat()
    })

@bp.route('/', methods=['POST'])
def create_journey():
    data = request.json
    j = Journey(
        name=data.get('name', 'Untitled Journey'),
        status=data.get('status', 'draft'),
        nodes_json=data.get('nodes_json', []),
        edges_json=data.get('edges_json', [])
    )
    db.session.add(j)
    db.session.commit()
    return jsonify({"id": j.id}), 201

@bp.route('/<int:id>', methods=['PUT'])
def update_journey(id):
    j = Journey.query.get_or_404(id)
    data = request.json
    if 'name' in data:
        j.name = data['name']
    if 'status' in data:
        j.status = data['status']
    if 'nodes_json' in data:
        j.nodes_json = data['nodes_json']
    if 'edges_json' in data:
        j.edges_json = data['edges_json']
    db.session.commit()
    return jsonify({"message": "Updated successfully"}), 200

@bp.route('/<int:id>', methods=['DELETE'])
def delete_journey(id):
    j = Journey.query.get_or_404(id)
    # Also delete states
    JourneyState.query.filter_by(journey_id=id).delete()
    db.session.delete(j)
    db.session.commit()
    return jsonify({"message": "Deleted successfully"}), 200

@bp.route('/<int:id>/activate', methods=['POST'])
def activate_journey(id):
    result = JourneyEngine.activate_journey(id)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result), 200

@bp.route('/engine/tick', methods=['POST'])
def run_engine_tick():
    # This acts as our manual cron-trigger for the execution engine
    stats = JourneyEngine.run_tick()
    return jsonify({"message": "Engine tick complete", "stats": stats}), 200

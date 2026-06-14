from datetime import datetime
from flask import Blueprint, jsonify, request
from app.models import db, CommunicationLog, Campaign

communications_bp = Blueprint('communications', __name__)

@communications_bp.route('/', methods=['POST'])
def create_communication_log():
    data = request.json
    
    if not data or not data.get('campaign_id') or not data.get('event_type'):
        return jsonify({"error": "campaign_id and event_type are required"}), 400
        
    log = CommunicationLog(
        campaign_id=data['campaign_id'],
        event_type=data['event_type'],
        timestamp=datetime.utcnow()
    )
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        "id": log.id,
        "campaign_id": log.campaign_id,
        "event_type": log.event_type,
        "timestamp": log.timestamp.isoformat() if log.timestamp else None
    }), 201

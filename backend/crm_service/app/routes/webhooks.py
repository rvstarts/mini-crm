from datetime import datetime
from flask import Blueprint, jsonify, request
from app.models import db, CommunicationLog, Campaign

webhooks_bp = Blueprint('webhooks', __name__)

@webhooks_bp.route('/channel-event', methods=['POST'])
def handle_channel_event():
    data = request.json
    
    campaign_id = data.get('campaign_id')
    customer_id = data.get('customer_id')
    event_type = data.get('event_type')
    
    if not campaign_id or not event_type:
        return jsonify({"error": "campaign_id and event_type are required"}), 400
        
    log = CommunicationLog(
        campaign_id=campaign_id,
        customer_id=customer_id,
        event_type=event_type,
        timestamp=datetime.utcnow()
    )
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify({"status": "received"}), 200

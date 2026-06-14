from flask import Blueprint, request, jsonify
from app.models import db, Customer, Campaign, Segment
from sqlalchemy import or_

bp = Blueprint('search', __name__)

@bp.route('/', methods=['GET'])
def global_search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({"results": []})
        
    search_term = f"%{query}%"
    results = []

    # Search Customers
    customers = Customer.query.filter(
        or_(
            Customer.name.ilike(search_term),
            Customer.email.ilike(search_term)
        )
    ).limit(4).all()
    
    for c in customers:
        results.append({
            "id": c.id,
            "type": "customer",
            "title": c.name,
            "subtitle": c.email,
            "url": f"/customers/{c.id}"
        })

    # Search Campaigns
    campaigns = Campaign.query.filter(
        Campaign.name.ilike(search_term)
    ).limit(4).all()
    
    for c in campaigns:
        results.append({
            "id": c.id,
            "type": "campaign",
            "title": c.name,
            "subtitle": c.status.capitalize(),
            "url": f"/campaigns/{c.id}"
        })

    # Search Segments
    segments = Segment.query.filter(
        or_(
            Segment.name.ilike(search_term),
            Segment.description.ilike(search_term)
        )
    ).limit(4).all()
    
    for s in segments:
        results.append({
            "id": s.id,
            "type": "segment",
            "title": s.name,
            "subtitle": f"{s.audience_count} customers",
            "url": f"/segments/{s.id}"
        })

    # Action for AI Command Center
    ai_keywords = ["ai", "command", "chat", "pulse", "bot", "assistant"]
    if any(k in query.lower() for k in ai_keywords):
        results.append({
            "id": "action-ai",
            "type": "action",
            "title": "Open AI Command Center",
            "subtitle": "Pulse AI Copilot",
            "action": "open_ai_command"
        })

    return jsonify({"results": results})

from flask import Blueprint, jsonify, request
from app.models import db, Segment, Journey, Customer
from datetime import datetime, timedelta

segments_bp = Blueprint('segments', __name__)

@segments_bp.route('/', methods=['GET'])
def get_segments():
    segments = db.session.query(Segment, Journey).outerjoin(Journey, Segment.journey_id == Journey.id).order_by(Segment.created_at.desc()).all()
    data = [{
        "id": s.id,
        "name": s.name,
        "description": s.description,
        "audience_count": s.audience_count,
        "journey_id": s.journey_id,
        "journey_name": j.name if j else None,
        "ai_reasoning": s.ai_reasoning,
        "estimated_recovery": s.estimated_recovery,
        "recommended_campaign": s.recommended_campaign,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    } for s, j in segments]
    return jsonify(data)

@segments_bp.route('/<int:id>', methods=['GET'])
def get_segment(id):
    result = db.session.query(Segment, Journey).outerjoin(Journey, Segment.journey_id == Journey.id).filter(Segment.id == id).first_or_404()
    s, j = result
    return jsonify({
        "id": s.id,
        "name": s.name,
        "description": s.description,
        "rules_json": s.rules_json,
        "audience_count": s.audience_count,
        "journey_id": s.journey_id,
        "journey_name": j.name if j else None,
        "ai_reasoning": s.ai_reasoning,
        "estimated_recovery": s.estimated_recovery,
        "recommended_campaign": s.recommended_campaign,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    })

@segments_bp.route('/', methods=['POST'])
def create_segment():
    data = request.json
    s = Segment(
        name=data.get('name'),
        description=data.get('description'),
        rules_json=data.get('rules_json'),
        audience_count=data.get('audience_count', 0),
        journey_id=data.get('journey_id'),
        ai_reasoning=data.get('ai_reasoning'),
        estimated_recovery=data.get('estimated_recovery', 0.0),
        recommended_campaign=data.get('recommended_campaign')
    )
    db.session.add(s)
    
    opportunity_id = data.get('opportunity_id')
    if opportunity_id:
        from app.models import AIOpportunity
        opp = AIOpportunity.query.get(opportunity_id)
        if opp:
            opp.status = 'consumed'
            
    db.session.commit()
    return jsonify({"id": s.id, "status": "created"}), 201

@segments_bp.route('/<int:id>', methods=['PUT'])
def update_segment(id):
    s = Segment.query.get_or_404(id)
    data = request.json
    if 'name' in data: s.name = data['name']
    if 'description' in data: s.description = data['description']
    if 'rules_json' in data: s.rules_json = data['rules_json']
    if 'audience_count' in data: s.audience_count = data['audience_count']
    if 'journey_id' in data: s.journey_id = data['journey_id']
    
    db.session.commit()
    return jsonify({"id": s.id, "status": "updated"}), 200

@segments_bp.route('/<int:id>', methods=['DELETE'])
def delete_segment(id):
    s = Segment.query.get_or_404(id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200

@segments_bp.route('/<int:id>/customers', methods=['GET'])
def get_segment_customers(id):
    s = Segment.query.get_or_404(id)
    rules = s.rules_json or []
    
    query = Customer.query
    
    for rule in rules:
        field = rule.get("field")
        operator = rule.get("operator")
        value = rule.get("value")
        
        if field == "city" or field == "City":
            if operator == "equals" or operator == "Equals":
                query = query.filter(Customer.city.ilike(f"{value}"))
            elif operator == "contains" or operator == "Contains":
                query = query.filter(Customer.city.ilike(f"%{value}%"))
            elif operator == "Not equals":
                query = query.filter(Customer.city.ilike(f"{value}") == False)
                
        elif field == "total_spend" or field == "Total Spend":
            try:
                v = float(value)
                if operator == "equals" or operator == "Equals": query = query.filter(Customer.total_spend == v)
                elif operator == ">" or operator == "Is greater than": query = query.filter(Customer.total_spend > v)
                elif operator == "<" or operator == "Is less than": query = query.filter(Customer.total_spend < v)
                elif operator == ">=": query = query.filter(Customer.total_spend >= v)
                elif operator == "<=": query = query.filter(Customer.total_spend <= v)
            except: pass
            
        elif field == "order_count" or field == "Order Count":
            try:
                v = int(value)
                if operator == "equals" or operator == "Equals": query = query.filter(Customer.order_count == v)
                elif operator == ">" or operator == "Is greater than": query = query.filter(Customer.order_count > v)
                elif operator == "<" or operator == "Is less than": query = query.filter(Customer.order_count < v)
                elif operator == ">=": query = query.filter(Customer.order_count >= v)
                elif operator == "<=": query = query.filter(Customer.order_count <= v)
            except: pass
            
        elif field == "days_since_last_purchase":
            try:
                v = int(value)
                target_date = datetime.utcnow() - timedelta(days=v)
                if operator == ">" or operator == ">=":
                    query = query.filter(Customer.last_active <= target_date)
                elif operator == "<" or operator == "<=":
                    query = query.filter(Customer.last_active >= target_date)
            except: pass
            
        elif field == "Last Purchase Date":
            try:
                target_date = datetime.strptime(value, "%Y-%m-%d")
                if operator == "Is older than":
                    query = query.filter(Customer.last_active < target_date)
                elif operator == "Is newer than":
                    query = query.filter(Customer.last_active > target_date)
            except: pass
            
        elif field == "churn_risk_score":
            try:
                v = int(value)
                if operator == ">=" or operator == ">" or operator == "Is greater than": query = query.filter(Customer.churn_risk_score >= v)
                elif operator == "<=" or operator == "<" or operator == "Is less than": query = query.filter(Customer.churn_risk_score <= v)
                elif operator == "equals" or operator == "Equals" or operator == "==": query = query.filter(Customer.churn_risk_score == v)
            except: pass
            
        elif field == "churn_risk_category":
            if operator == "equals" or operator == "Equals" or operator == "==":
                query = query.filter(Customer.churn_risk_category.ilike(f"{value}"))
            elif operator == "Not equals" or operator == "!=":
                query = query.filter(Customer.churn_risk_category.ilike(f"{value}") == False)

    matched_customers = query.all()
    data = [{
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "last_active": c.last_active.isoformat() if c.last_active else None,
        "total_spend": float(c.total_spend) if c.total_spend else 0.0,
        "avg_order_value": float(c.avg_order_value) if c.avg_order_value else 0.0,
        "churn_risk_score": c.churn_risk_score,
        "churn_risk_category": c.churn_risk_category
    } for c in matched_customers]
    
    return jsonify(data)

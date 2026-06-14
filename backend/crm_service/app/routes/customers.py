from flask import Blueprint, jsonify, request
from app.models import db, Customer, Order, Campaign, CommunicationLog, CustomerAiAnalysis
from app.services.ai_service import analyze_churn, generate_customer_intelligence
from datetime import datetime

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/', methods=['GET'])
def get_customers():
    customers = Customer.query.order_by(Customer.created_at.desc()).all()
    data = [{
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "city": c.city,
        "total_spend": c.total_spend,
        "order_count": c.order_count,
        "avg_order_value": c.avg_order_value,
        "last_active": c.last_active.isoformat() if c.last_active else None,
        "churn_risk_score": c.churn_risk_score,
        "churn_risk_category": c.churn_risk_category,
        "churn_risk_reason": c.churn_risk_reason,
        "churn_risk_recommendation": c.churn_risk_recommendation,
        "churn_risk_generated_at": c.churn_risk_generated_at.isoformat() if c.churn_risk_generated_at else None,
        "predicted_ltv": c.predicted_ltv,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    } for c in customers]
    return jsonify(data)

@customers_bp.route('/<int:id>', methods=['GET'])
def get_customer(id):
    c = Customer.query.get_or_404(id)
    orders = Order.query.filter_by(customer_id=id).order_by(Order.created_at.desc()).all()
    data = {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "city": c.city,
        "total_spend": c.total_spend,
        "order_count": c.order_count,
        "avg_order_value": c.avg_order_value,
        "last_active": c.last_active.isoformat() if c.last_active else None,
        "churn_risk_score": c.churn_risk_score,
        "churn_risk_category": c.churn_risk_category,
        "churn_risk_reason": c.churn_risk_reason,
        "churn_risk_recommendation": c.churn_risk_recommendation,
        "churn_risk_generated_at": c.churn_risk_generated_at.isoformat() if c.churn_risk_generated_at else None,
        "predicted_ltv": c.predicted_ltv,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "orders": [{
            "id": o.id,
            "amount": o.amount,
            "category": o.category,
            "status": o.status,
            "channel": o.channel,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        } for o in orders]
    }
    return jsonify(data)

@customers_bp.route('/<int:id>', methods=['PUT'])
def update_customer(id):
    c = Customer.query.get_or_404(id)
    data = request.json
    
    if 'name' in data:
        c.name = data['name']
    if 'email' in data:
        c.email = data['email']
    if 'phone' in data:
        c.phone = data['phone']
    if 'city' in data:
        c.city = data['city']
        
    db.session.commit()
    
    return jsonify({
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "city": c.city
    })

@customers_bp.route('/bulk-analyze', methods=['POST'])
def bulk_analyze_churn():
    customers = Customer.query.all()
    count = 0
    for c in customers:
        # Build customer profile
        orders = Order.query.filter_by(customer_id=c.id).all()
        logs = CommunicationLog.query.filter_by(customer_id=c.id).all()
        
        opens = len([l for l in logs if l.event_type == 'opened'])
        clicks = len([l for l in logs if l.event_type == 'clicked'])
        sent = len([l for l in logs if l.event_type == 'sent'])
        redeemed = len([l for l in logs if l.event_type == 'redeemed'])
        
        open_rate = round((opens / sent * 100) if sent > 0 else 0)
        click_rate = round((clicks / sent * 100) if sent > 0 else 0)
        
        last_purchase_days = (datetime.utcnow() - c.last_active).days if c.last_active else 0
        
        profile = {
            "customer": {
                "name": c.name,
                "totalOrders": c.order_count,
                "totalSpend": c.total_spend,
                "lastPurchaseDays": last_purchase_days,
                "openRate": open_rate,
                "clickRate": click_rate,
                "redeemedCoupons": redeemed
            }
        }
        
        ai_res = analyze_churn(profile)
        if ai_res:
            c.churn_risk_score = ai_res.get('churnScore')
            c.churn_risk_category = ai_res.get('riskCategory')
            c.churn_risk_reason = ai_res.get('reason')
            c.churn_risk_recommendation = ai_res.get('recommendation')
            c.churn_risk_generated_at = datetime.utcnow()
            count += 1
            
    db.session.commit()
    return jsonify({"message": f"Successfully analyzed {count} customers"})

@customers_bp.route('/<int:id>/intelligence', methods=['GET'])
def get_customer_intelligence(id):
    c = Customer.query.get_or_404(id)
    analysis = CustomerAiAnalysis.query.filter_by(customer_id=id).first()
    if not analysis:
        return jsonify({"has_analysis": False}), 200
        
    return jsonify({
        "has_analysis": True,
        "predictedLTV": analysis.predicted_ltv,
        "riskScore": analysis.risk_score,
        "riskLevel": analysis.risk_level,
        "reason": analysis.reason,
        "recommendedAction": analysis.recommended_action,
        "bestChannel": analysis.best_channel,
        "nextBestOffer": analysis.next_best_offer,
        "confidence": analysis.confidence,
        "modelUsed": analysis.model_used,
        "generatedAt": analysis.generated_at.isoformat() if analysis.generated_at else None
    })

@customers_bp.route('/<int:id>/intelligence/refresh', methods=['POST'])
def refresh_customer_intelligence(id):
    c = Customer.query.get_or_404(id)
    
    # Gather real data
    orders = Order.query.filter_by(customer_id=id).all()
    logs = CommunicationLog.query.filter_by(customer_id=id).all()
    
    opens = len([l for l in logs if l.event_type == 'opened'])
    clicks = len([l for l in logs if l.event_type == 'clicked'])
    sent = len([l for l in logs if l.event_type == 'sent'])
    redeemed = len([l for l in logs if l.event_type == 'redeemed'])
    
    open_rate = round((opens / sent * 100) if sent > 0 else 0)
    click_rate = round((clicks / sent * 100) if sent > 0 else 0)
    last_purchase_days = (datetime.utcnow() - c.last_active).days if c.last_active else 0
    
    customer_data = {
        "name": c.name,
        "email": c.email,
        "totalOrders": c.order_count,
        "totalSpend": c.total_spend,
        "avgOrderValue": c.avg_order_value,
        "lastPurchaseDays": last_purchase_days,
        "openRate": open_rate,
        "clickRate": click_rate,
        "redemptionRate": round((redeemed / sent * 100) if sent > 0 else 0),
        "segmentMembership": "Low", # Can be fetched from segments if needed
        "purchaseFrequency": c.order_count / ((datetime.utcnow() - c.created_at).days / 30 or 1)
    }
    
    try:
        ai_res = generate_customer_intelligence(customer_data)
        
        analysis = CustomerAiAnalysis.query.filter_by(customer_id=id).first()
        if not analysis:
            analysis = CustomerAiAnalysis(customer_id=id)
            db.session.add(analysis)
            
        analysis.predicted_ltv = ai_res.get('predictedLTV')
        analysis.risk_score = ai_res.get('riskScore')
        analysis.risk_level = ai_res.get('riskLevel')
        analysis.reason = ai_res.get('reason')
        analysis.recommended_action = ai_res.get('recommendedAction')
        analysis.best_channel = ai_res.get('bestChannel')
        analysis.next_best_offer = ai_res.get('nextBestOffer')
        analysis.confidence = ai_res.get('confidence')
        analysis.model_used = ai_res.get('debug', {}).get('model', 'gemini-2.5-flash')
        analysis.generated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": {
                "predictedLTV": analysis.predicted_ltv,
                "riskScore": analysis.risk_score,
                "riskLevel": analysis.risk_level,
                "reason": analysis.reason,
                "recommendedAction": analysis.recommended_action,
                "bestChannel": analysis.best_channel,
                "nextBestOffer": analysis.next_best_offer,
                "confidence": analysis.confidence,
                "modelUsed": analysis.model_used,
                "generatedAt": analysis.generated_at.isoformat()
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

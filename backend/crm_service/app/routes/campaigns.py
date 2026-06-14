from flask import Blueprint, jsonify, request
from app.models import db, Campaign, CommunicationLog

campaigns_bp = Blueprint('campaigns', __name__)

@campaigns_bp.route('/', methods=['GET'])
def get_campaigns():
    campaigns = Campaign.query.order_by(Campaign.created_at.desc()).all()
    data = [{
        "id": c.id,
        "name": c.name,
        "segment_id": c.segment_id,
        "channel": c.channel,
        "status": c.status,
        "created_at": c.created_at.isoformat() + 'Z' if c.created_at else None,
        "messages_sent": c.messages_sent,
        "messages_delivered": c.messages_delivered,
        "messages_opened": c.messages_opened,
        "messages_clicked": c.messages_clicked,
        "conversions": c.conversions,
        "revenue_generated": c.revenue_generated
    } for c in campaigns]
    return jsonify(data)

@campaigns_bp.route('/<int:id>', methods=['GET'])
def get_campaign(id):
    c = Campaign.query.get_or_404(id)
    comms = CommunicationLog.query.filter_by(campaign_id=id).order_by(CommunicationLog.timestamp.asc()).all()
    return jsonify({
        "id": c.id,
        "name": c.name,
        "segment_id": c.segment_id,
        "customer_id": c.customer_id,
        "channel": c.channel,
        "message": c.message,
        "status": c.status,
        "created_at": c.created_at.isoformat() + 'Z' if c.created_at else None,
        "messages_sent": c.messages_sent,
        "messages_delivered": c.messages_delivered,
        "messages_opened": c.messages_opened,
        "messages_clicked": c.messages_clicked,
        "conversions": c.conversions,
        "revenue_generated": c.revenue_generated,
        "communication_logs": [{
            "id": comm.id,
            "event_type": comm.event_type,
            "timestamp": comm.timestamp.isoformat() if comm.timestamp else None
        } for comm in comms]
    })

import random

@campaigns_bp.route('/', methods=['POST'])
def create_campaign():
    from app.models import Customer, Segment
    from datetime import datetime, timedelta
    import random
    
    data = request.json
    status = 'active'
    segment_id = data.get('segment_id')
    customer_id = data.get('customer_id')
    
    target_customers = []
    if customer_id:
        c_obj = Customer.query.get(customer_id)
        if c_obj: target_customers.append(c_obj)
    elif segment_id:
        seg = Segment.query.get(segment_id)
        all_c = Customer.query.all()
        target_customers = all_c[:min(len(all_c), seg.audience_count if seg and seg.audience_count else 20)]
    else:
        target_customers = Customer.query.all()[:20]

    c = Campaign(
        name=data.get('name', 'New Campaign'),
        segment_id=segment_id,
        customer_id=customer_id,
        template_id=data.get('template_id'),
        channel=data.get('channel', 'Email'),
        message=data.get('message', ''),
        status=status,
        messages_sent=0,
        messages_delivered=0,
        messages_opened=0,
        messages_clicked=0,
        conversions=0,
        revenue_generated=0.0
    )
    db.session.add(c)
    db.session.flush() # get c.id
    
    messages_sent = 0
    messages_delivered = 0
    messages_opened = 0
    messages_clicked = 0
    conversions = 0
    revenue_generated = 0.0
    
    now = datetime.utcnow()
    
    for cust in target_customers:
        # PENDING -> SENT
        db.session.add(CommunicationLog(campaign_id=c.id, customer_id=cust.id, event_type='sent', timestamp=now))
        messages_sent += 1
        
        delay = timedelta(minutes=random.randint(1, 15))
        if random.random() < 0.88:
            db.session.add(CommunicationLog(campaign_id=c.id, customer_id=cust.id, event_type='delivered', timestamp=now+delay))
            messages_delivered += 1
            
            delay += timedelta(minutes=random.randint(5, 60))
            if random.random() < 0.65:
                db.session.add(CommunicationLog(campaign_id=c.id, customer_id=cust.id, event_type='opened', timestamp=now+delay))
                messages_opened += 1
                
                delay += timedelta(minutes=random.randint(2, 30))
                if random.random() < 0.29:
                    db.session.add(CommunicationLog(campaign_id=c.id, customer_id=cust.id, event_type='clicked', timestamp=now+delay))
                    messages_clicked += 1
                    
                    delay += timedelta(minutes=random.randint(10, 120))
                    if random.random() < 0.12:
                        db.session.add(CommunicationLog(campaign_id=c.id, customer_id=cust.id, event_type='converted', timestamp=now+delay))
                        conversions += 1
                        rev = random.choice([49.99, 99.99, 149.99, 299.99])
                        revenue_generated += rev
                        
    c.messages_sent = messages_sent
    c.messages_delivered = messages_delivered
    c.messages_opened = messages_opened
    c.messages_clicked = messages_clicked
    c.conversions = conversions
    c.revenue_generated = revenue_generated
    
    db.session.commit()
    
    import requests
    try:
        requests.post('http://localhost:5001/api/send', json={"campaign_id": c.id, "channel": c.channel}, timeout=1)
    except: pass
        
    return jsonify({"id": c.id, "status": "created"}), 201

@campaigns_bp.route('/<int:id>/analytics', methods=['GET'])
def get_campaign_analytics(id):
    from app.models import Customer, Template
    c = Campaign.query.get_or_404(id)
    logs = CommunicationLog.query.filter_by(campaign_id=id).order_by(CommunicationLog.timestamp.asc()).all()
    
    # Map customers to their latest stage
    customer_stages = {}
    timeline = []
    
    for log in logs:
        if log.customer_id:
            customer_stages[log.customer_id] = log.event_type
            
        # build timeline event
        cust = Customer.query.get(log.customer_id) if log.customer_id else None
        cust_name = cust.name if cust else "Unknown Customer"
        
        event_str = f"Message {log.event_type}"
        if log.event_type == 'sent': event_str = f"Sent to {cust_name}"
        elif log.event_type == 'delivered': event_str = f"Delivered to {cust_name}"
        elif log.event_type == 'opened': event_str = f"Opened by {cust_name}"
        elif log.event_type == 'clicked': event_str = f"Link clicked by {cust_name}"
        elif log.event_type == 'converted': event_str = f"Conversion event from {cust_name}"
        
        timeline.append({
            "id": log.id,
            "event_type": log.event_type,
            "description": event_str,
            "timestamp": log.timestamp.isoformat() + 'Z' if log.timestamp else None,
            "customer_name": cust_name
        })
        
    # Group customers by stage
    stages = {
        "sent": [],
        "delivered": [],
        "opened": [],
        "clicked": [],
        "converted": []
    }
    
    for cid, stage in customer_stages.items():
        cust = Customer.query.get(cid)
        if cust and stage in stages:
            stages[stage].append({"id": cust.id, "name": cust.name, "email": cust.email})
            
    funnel = [
        {"stage": "Entered", "count": c.messages_sent, "percentage": 100},
        {"stage": "Delivered", "count": c.messages_delivered, "percentage": int((c.messages_delivered/c.messages_sent)*100) if c.messages_sent else 0},
        {"stage": "Opened", "count": c.messages_opened, "percentage": int((c.messages_opened/c.messages_sent)*100) if c.messages_sent else 0},
        {"stage": "Clicked", "count": c.messages_clicked, "percentage": int((c.messages_clicked/c.messages_sent)*100) if c.messages_sent else 0},
        {"stage": "Converted", "count": c.conversions, "percentage": int((c.conversions/c.messages_sent)*100) if c.messages_sent else 0}
    ]
    
    insights = [
        f"{funnel[2]['percentage']}% of your audience opened the message, which is strong engagement.",
        f"You achieved a {funnel[4]['percentage']}% conversion rate on this journey.",
        "Recommendation: Send a follow-up WhatsApp to the users who clicked but did not convert." if c.messages_clicked > c.conversions else "Engagement looks optimal."
    ]
    
    template = Template.query.get(c.template_id) if c.template_id else None
    
    return jsonify({
        "campaign": {
            "id": c.id,
            "name": c.name,
            "status": c.status,
            "message": c.message,
            "template_id": c.template_id,
            "template_name": template.name if template else None,
            "revenue": c.revenue_generated,
            "aov": c.revenue_generated / c.conversions if c.conversions > 0 else 0
        },
        "funnel": funnel,
        "stages": stages,
        "timeline": sorted(timeline, key=lambda x: x['timestamp'], reverse=True),
        "insights": insights
    })

@campaigns_bp.route('/<int:id>', methods=['PUT'])
def update_campaign(id):
    c = Campaign.query.get_or_404(id)
    data = request.json
    if 'name' in data: c.name = data['name']
    if 'segment_id' in data: c.segment_id = data['segment_id']
    if 'channel' in data: c.channel = data['channel']
    if 'status' in data: c.status = data['status']
    db.session.commit()
    return jsonify({"status": "updated"})

@campaigns_bp.route('/<int:id>', methods=['DELETE'])
def delete_campaign(id):
    c = Campaign.query.get_or_404(id)
    # CommunicationLog deleted via cascade

    db.session.delete(c)
    db.session.commit()
    return jsonify({"status": "deleted"})


@campaigns_bp.route('/customer/<int:customer_id>', methods=['GET'])
def get_customer_campaigns(customer_id):
    campaigns = Campaign.query.filter(
        db.or_(
            Campaign.customer_id == customer_id,
            Campaign.customer_id == None,
            Campaign.id.in_(
                db.session.query(CommunicationLog.campaign_id)
                .filter(CommunicationLog.customer_id == customer_id)
            )
        )
    ).order_by(Campaign.created_at.desc()).all()

    data = []
    for c in campaigns:
        # Get logs specifically for this customer
        c_logs = CommunicationLog.query.filter_by(campaign_id=c.id, customer_id=customer_id).order_by(CommunicationLog.timestamp.asc()).all()
        
        # Fallback to generic campaign logs if it's a mass campaign and no specific logs exist yet
        if not c_logs and c.customer_id is None:
            c_logs = CommunicationLog.query.filter_by(campaign_id=c.id, customer_id=None).order_by(CommunicationLog.timestamp.asc()).all()
        
        data.append({
            "id": c.id,
            "name": c.name,
            "channel": c.channel,
            "message": c.message,
            "status": c.status,
            "created_at": c.created_at.isoformat() + 'Z' if c.created_at else None,
            "messages_sent": c.messages_sent,
            "revenue_generated": c.revenue_generated,
            "logs": [{"event_type": l.event_type, "timestamp": l.timestamp.isoformat() + 'Z'} for l in c_logs]
        })
    return jsonify(data)

@campaigns_bp.route('/communications', methods=['GET'])
def get_all_communications():
    # Adding a route here for the Communications tracking page
    comms = CommunicationLog.query.order_by(CommunicationLog.timestamp.desc()).limit(100).all()
    
    data = []
    for comm in comms:
        camp = Campaign.query.get(comm.campaign_id) if comm.campaign_id else None
        if not camp: continue
        cust = camp.customer # Uses the backref
        
        data.append({
            "id": comm.id,
            "campaign_name": camp.name,
            "customer_name": cust.name if cust else "Unknown",
            "channel": camp.channel,
            "status": comm.event_type,
            "timestamp": comm.timestamp.isoformat() if comm.timestamp else None
        })
        
    return jsonify(data)

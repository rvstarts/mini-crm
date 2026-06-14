from flask import Blueprint, jsonify, request
from app.models import db, Customer, Campaign, Segment, Order, CommunicationLog, AIOpportunity, AICampaignOpportunity
from datetime import datetime, timedelta
from app.services import ai_service

copilot_bp = Blueprint('copilot', __name__)

@copilot_bp.route('/insights', methods=['GET'])
def get_insights():
    customers = Customer.query.all()
    orders = Order.query.all()
    
    # Calculate some aggregates to feed into Gemini
    total_customers = len(customers)
    high_risk = sum(1 for c in customers if c.churn_risk_score and c.churn_risk_score >= 70)
    total_revenue = sum(o.amount for o in orders if o.status == 'completed' and o.amount)
    
    data_summary = {
        "total_customers": total_customers,
        "high_risk_customers_count": high_risk,
        "total_revenue": total_revenue,
        "top_channels": ["WhatsApp", "Email", "SMS"] # Mocked for summary context
    }
    
    ai_response = ai_service.generate_business_insights(data_summary)
    
    if not ai_response:
        # Fail safe
        return jsonify({
            "error": "AI insights temporarily unavailable.",
            "ai_opportunities_found": 0,
            "high_risk_customers": high_risk,
            "revenue_opportunity": 0,
            "campaign_suggestions": 0,
            "recommended_action": "Review data manually."
        }), 503

    return jsonify(ai_response)

@copilot_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    # We can just fetch the insights again, since it returns recommendation_cards
    # Or for efficiency, we just do a quick AI call for cards.
    customers = Customer.query.all()
    data_summary = {
        "total_customers": len(customers),
        "high_risk_customers": sum(1 for c in customers if c.churn_risk_score and c.churn_risk_score >= 70)
    }
    
    ai_response = ai_service.generate_business_insights(data_summary)
    if not ai_response or "recommendation_cards" not in ai_response:
        return jsonify([{"id": 0, "title": "AI insights temporarily unavailable.", "action": "Retry"}]), 503
        
    return jsonify(ai_response["recommendation_cards"])

def evaluate_rules_and_get_count(rules):
    from datetime import datetime, timedelta
    query = Customer.query
    for rule in rules:
        field = rule.get("field")
        operator = rule.get("operator")
        value = rule.get("value")
        
        if field in ["city", "City"]:
            if operator in ["equals", "Equals"]: query = query.filter(Customer.city.ilike(f"{value}"))
            elif operator in ["contains", "Contains"]: query = query.filter(Customer.city.ilike(f"%{value}%"))
            elif operator == "Not equals": query = query.filter(Customer.city.ilike(f"{value}") == False)
        elif field in ["total_spend", "Total Spend"]:
            try:
                v = float(value)
                if operator in ["equals", "Equals"]: query = query.filter(Customer.total_spend == v)
                elif operator in [">", ">=", "Is greater than"]: query = query.filter(Customer.total_spend >= v)
                elif operator in ["<", "<=", "Is less than"]: query = query.filter(Customer.total_spend <= v)
            except: pass
        elif field in ["order_count", "Order Count"]:
            try:
                v = int(value)
                if operator in ["equals", "Equals"]: query = query.filter(Customer.order_count == v)
                elif operator in [">", ">=", "Is greater than"]: query = query.filter(Customer.order_count >= v)
                elif operator in ["<", "<=", "Is less than"]: query = query.filter(Customer.order_count <= v)
            except: pass
        elif field == "days_since_last_purchase":
            try:
                v = int(value)
                target_date = datetime.utcnow() - timedelta(days=v)
                if operator in [">", ">="]: query = query.filter(Customer.last_active <= target_date)
                elif operator in ["<", "<="]: query = query.filter(Customer.last_active >= target_date)
            except: pass
        elif field == "churn_risk_score":
            try:
                v = int(value)
                if operator in [">=", ">"]: query = query.filter(Customer.churn_risk_score >= v)
                elif operator in ["<=", "<"]: query = query.filter(Customer.churn_risk_score <= v)
            except: pass
        elif field == "churn_risk_category":
            if operator in ["equals", "Equals", "=="]: query = query.filter(Customer.churn_risk_category.ilike(f"{value}"))
            elif operator in ["Not equals", "!="]: query = query.filter(Customer.churn_risk_category.ilike(f"{value}") == False)

    return len(query.all())

@copilot_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').lower()
    history = data.get('history', [])
    
    customers = Customer.query.all()
    high_risk = sum(1 for c in customers if c.churn_risk_score >= 70)
    vip_count = sum(1 for c in customers if (c.total_spend or 0) >= 5000)
    total_spend = sum((c.total_spend or 0) for c in customers)
    
    data_summary = {
        "total_customers": len(customers),
        "high_risk_customers_count": high_risk,
        "vip_customers_count": vip_count,
        "total_revenue": total_spend
    }
    
    ai_response = ai_service.chat_with_data(message, data_summary, history)
    if "role" not in ai_response:
        ai_response["role"] = "ai"
        
    # Execute actionable generation if requested
    if "create_segment" in ai_response and ai_response["create_segment"]:
        try:
            seg_data = ai_response["create_segment"]
            rules = seg_data.get("rules_json", [])
            
            actual_count = evaluate_rules_and_get_count(rules)

            new_seg = Segment(
                name=seg_data.get("name", "AI Segment"),
                description=seg_data.get("description", ""),
                rules_json=rules,
                audience_count=actual_count
            )
            db.session.add(new_seg)
            db.session.commit()
            
            # Sync AI metrics with reality
            if "metrics" in ai_response:
                for k in list(ai_response["metrics"].keys()):
                    if "size" in k.lower() or "count" in k.lower() or "customer" in k.lower():
                        ai_response["metrics"][k] = f"{actual_count} customers"
            
            ai_response["content"] += f"\n\n**✓ Segment '{new_seg.name}' has been created and saved with exactly {actual_count} matching customers!**"
            del ai_response["create_segment"]
        except Exception as e:
            db.session.rollback()
            ai_response["content"] += f"\n\n*(Failed to save segment: {str(e)})*"

    if "create_campaign_opportunity" in ai_response and ai_response["create_campaign_opportunity"]:
        try:
            camp_data = ai_response["create_campaign_opportunity"]
            rules = camp_data.get("rules_json", [])
            actual_count = evaluate_rules_and_get_count(rules)

            # Create the segment for this campaign
            new_seg = Segment(
                name=camp_data.get("target_audience", "Campaign Segment"),
                description=f"Auto-generated segment for: {camp_data.get('campaign_name')}",
                rules_json=rules,
                audience_count=actual_count
            )
            db.session.add(new_seg)
            db.session.flush()

            # Create the LIVE Campaign
            # Using same realistic random logic from campaigns.py
            import random
            messages_sent = actual_count
            messages_delivered = int(messages_sent * random.uniform(0.9, 0.99)) if messages_sent > 0 else 0
            messages_opened = int(messages_delivered * random.uniform(0.2, 0.6)) if messages_delivered > 0 else 0
            messages_clicked = int(messages_opened * random.uniform(0.1, 0.4)) if messages_opened > 0 else 0
            revenue_generated = float(messages_clicked * random.randint(10, 50))

            new_campaign = Campaign(
                name=camp_data.get("campaign_name", "AI Campaign"),
                segment_id=new_seg.id,
                channel=camp_data.get("recommended_channel", "Email"),
                message=camp_data.get("message_content", ""),
                status="active",
                messages_sent=messages_sent,
                messages_delivered=messages_delivered,
                messages_opened=messages_opened,
                messages_clicked=messages_clicked,
                revenue_generated=revenue_generated
            )
            db.session.add(new_campaign)
            db.session.commit()
            
            # Sync AI metrics with reality
            if "metrics" in ai_response:
                for k in list(ai_response["metrics"].keys()):
                    if "size" in k.lower() or "count" in k.lower() or "customer" in k.lower() or "audience" in k.lower():
                        ai_response["metrics"][k] = f"{actual_count} customers"

            ai_response["content"] += f"\n\n**✓ Campaign '{new_campaign.name}' was launched successfully to {actual_count} customers! You can track its performance on the Campaigns page.**"
            del ai_response["create_campaign_opportunity"]
        except Exception as e:
            db.session.rollback()
            ai_response["content"] += f"\n\n*(Failed to generate campaign: {str(e)})*"

    return jsonify(ai_response)

@copilot_bp.route('/generate-customer-analysis/<int:id>', methods=['GET'])
def generate_customer_analysis(id):
    customer = Customer.query.get_or_404(id)
    orders = Order.query.filter_by(customer_id=id).order_by(Order.created_at.desc()).all()
    logs = CommunicationLog.query.filter_by(customer_id=id).all()

    # Compute engagement metrics from real data
    sent = len([l for l in logs if l.event_type == 'sent'])
    opens = len([l for l in logs if l.event_type == 'opened'])
    clicks = len([l for l in logs if l.event_type == 'clicked'])
    redeemed = len([l for l in logs if l.event_type == 'redeemed'])
    open_rate = round((opens / sent * 100) if sent > 0 else 0)
    click_rate = round((clicks / sent * 100) if sent > 0 else 0)

    # Recency
    last_purchase_days = (datetime.utcnow() - customer.last_active).days if customer.last_active else 0

    # Purchase trend: compare last 3 orders vs 3 before that
    recent_orders = orders[:3]
    older_orders = orders[3:6]
    recent_avg = sum(o.amount for o in recent_orders) / len(recent_orders) if recent_orders else 0
    older_avg = sum(o.amount for o in older_orders) / len(older_orders) if older_orders else 0
    trend = "Increasing" if recent_avg > older_avg else ("Stable" if recent_avg == older_avg else "Declining")

    # Channels engagement
    emails_sent = len([l for l in logs if l.event_type == 'sent' and l.campaign and l.campaign.channel == 'Email'])
    emails_opened = len([l for l in logs if l.event_type == 'opened' and l.campaign and l.campaign.channel == 'Email'])
    emails_clicked = len([l for l in logs if l.event_type == 'clicked' and l.campaign and l.campaign.channel == 'Email'])
    sms_engagement = len([l for l in logs if l.campaign and l.campaign.channel == 'SMS'])
    whatsapp_engagement = len([l for l in logs if l.campaign and l.campaign.channel == 'WhatsApp'])
    
    # Extract segment mock for now since it's not a direct column, or use existing category
    segment = customer.churn_risk_category or "General"
    
    customer_data = {
        "customer": {
            "name": customer.name,
            "email": customer.email,
            "city": customer.city,
            "segment": segment
        },
        "order_history": {
            "order_count": customer.order_count,
            "last_purchase_days": last_purchase_days,
            "total_spend": float(customer.total_spend) if customer.total_spend else 0,
            "average_order_value": float(customer.avg_order_value) if customer.avg_order_value else 0
        },
        "engagement": {
            "emails_sent": emails_sent if emails_sent > 0 else sent,
            "emails_opened": emails_opened if emails_opened > 0 else opens,
            "emails_clicked": emails_clicked if emails_clicked > 0 else clicks,
            "sms_engagement": sms_engagement,
            "whatsapp_engagement": whatsapp_engagement,
            "coupon_redemptions": redeemed,
            "campaign_participation": sent
        }
    }

    import logging
    logging.info(f"[Copilot] Customer analysis payload for id={id}: {customer_data}")

    ai_response = ai_service.analyze_customer(customer_data)

    logging.info(f"[Copilot] AI response for id={id}: {ai_response}")

    if not ai_response:
        return jsonify({"error": "AI insights temporarily unavailable."}), 503

    # Inject the computed last_purchase_days if AI didn't return it
    ai_response.setdefault("last_purchase_days", last_purchase_days)
    return jsonify(ai_response)

@copilot_bp.route('/generate-segment', methods=['POST'])
def generate_segment():
    try:
        data = request.json
        prompt_text = data.get('prompt', '')
        
        # We don't need to fetch a sample anymore since Gemini is just parsing rules
        ai_response = ai_service.generate_segments([], prompt_text)
        
        # Apply the rules to the database to calculate real metrics
        segments = ai_response.get("segments", [])
        if not segments:
            return jsonify({"error": "No segments generated."}), 400
            
        for segment in segments:
            rules = segment.get("rules", [])
            
            # Start base query
            query = Customer.query
            
            for rule in rules:
                field = rule.get("field")
                operator = rule.get("operator")
                value = rule.get("value")
                
                if field == "city":
                    if operator == "equals":
                        query = query.filter(Customer.city.ilike(f"{value}"))
                    elif operator == "contains":
                        query = query.filter(Customer.city.ilike(f"%{value}%"))
                elif field == "total_spend":
                    try:
                        v = float(value)
                        if operator == "equals": query = query.filter(Customer.total_spend == v)
                        elif operator == ">": query = query.filter(Customer.total_spend > v)
                        elif operator == "<": query = query.filter(Customer.total_spend < v)
                        elif operator == ">=": query = query.filter(Customer.total_spend >= v)
                        elif operator == "<=": query = query.filter(Customer.total_spend <= v)
                    except: pass
                elif field == "order_count":
                    try:
                        v = int(value)
                        if operator == "equals": query = query.filter(Customer.order_count == v)
                        elif operator == ">": query = query.filter(Customer.order_count > v)
                        elif operator == "<": query = query.filter(Customer.order_count < v)
                        elif operator == ">=": query = query.filter(Customer.order_count >= v)
                        elif operator == "<=": query = query.filter(Customer.order_count <= v)
                    except: pass
                elif field == "days_since_last_purchase":
                    # This is tricky because we have last_active date
                    # days_since_last_purchase > X means last_active < (now - X days)
                    try:
                        v = int(value)
                        target_date = datetime.utcnow() - timedelta(days=v)
                        if operator == ">" or operator == ">=":
                            query = query.filter(Customer.last_active <= target_date)
                        elif operator == "<" or operator == "<=":
                            query = query.filter(Customer.last_active >= target_date)
                    except: pass
                    
            matched_customers = query.all()
            segment["estimated_customer_count"] = len(matched_customers)
            
            # Calculate estimated recovery (mocked as total_spend * 0.1 for now, or avg_order_value)
            recovery = sum((c.avg_order_value or 0) for c in matched_customers)
            segment["estimated_recovery"] = round(recovery, 2)
            segment["expected_revenue"] = round(sum((c.total_spend or 0) for c in matched_customers), 2)
            
        return jsonify(ai_response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@copilot_bp.route('/campaign-opportunity', methods=['GET'])
def get_campaign_opportunity():
    try:
        pending_opp = AICampaignOpportunity.query.filter_by(status='pending').order_by(AICampaignOpportunity.created_at.desc()).first()
        
        customers = Customer.query.all()
        
        if pending_opp:
            # Re-evaluate rules to find matching customers
            matched_customers = _evaluate_rules(customers, pending_opp.rules_json)
            return jsonify({
                "id": pending_opp.id,
                "campaign_name": pending_opp.campaign_name,
                "objective": pending_opp.objective,
                "target_audience": pending_opp.target_audience,
                "target_audience_size": len(matched_customers),
                "recommended_channel": pending_opp.recommended_channel,
                "subject_line": pending_opp.subject_line,
                "message_content": pending_opp.message_content,
                "expected_revenue": pending_opp.expected_revenue,
                "confidence": pending_opp.confidence,
                "rules": pending_opp.rules_json,
                "customers": [
                    {
                        "id": c.id,
                        "name": c.name,
                        "churn_risk_score": c.churn_risk_score,
                        "total_spend": c.total_spend,
                        "reason": _generate_reason(c, pending_opp.rules_json)
                    } for c in matched_customers
                ]
            })

        # Calculate some basic segments to feed to the AI
        high_risk_count = sum(1 for c in customers if c.churn_risk_score and c.churn_risk_score >= 70)
        high_value_count = sum(1 for c in customers if c.total_spend and c.total_spend >= 1000)
        dormant_count = sum(1 for c in customers if c.last_active and (datetime.utcnow() - c.last_active).days > 60)
        
        # Avoid duplicate ideas
        existing_campaigns = Campaign.query.with_entities(Campaign.name).all()
        past_opps = AICampaignOpportunity.query.with_entities(AICampaignOpportunity.campaign_name).all()
        existing_names = list(set([c[0] for c in existing_campaigns] + [o[0] for o in past_opps]))

        data_summary = {
            "total_customers": len(customers),
            "high_risk_customers_count": high_risk_count,
            "high_value_customers_count": high_value_count,
            "dormant_customers_count": dormant_count,
            "existing_campaigns": existing_names
        }
        
        ai_response = ai_service.generate_campaign(data_summary, "Find top campaign opportunity to prevent churn and drive revenue")
        if not ai_response:
            return jsonify({"error": "AI insights temporarily unavailable."}), 503
            
        new_opp = AICampaignOpportunity(
            campaign_name=ai_response.get("campaign_name", "New Campaign"),
            objective=ai_response.get("objective", ""),
            target_audience=ai_response.get("target_audience", ""),
            recommended_channel=ai_response.get("recommended_channel", "Email"),
            subject_line=ai_response.get("subject_line", ""),
            message_content=ai_response.get("message_content", ""),
            expected_revenue=ai_response.get("expected_revenue", 0.0),
            confidence=ai_response.get("confidence", 0.9),
            rules_json=ai_response.get("rules", []),
            status='pending'
        )
        db.session.add(new_opp)
        db.session.commit()
        
        matched_customers = _evaluate_rules(customers, new_opp.rules_json)
        
        return jsonify({
            "id": new_opp.id,
            "campaign_name": new_opp.campaign_name,
            "objective": new_opp.objective,
            "target_audience": new_opp.target_audience,
            "target_audience_size": len(matched_customers),
            "recommended_channel": new_opp.recommended_channel,
            "subject_line": new_opp.subject_line,
            "message_content": new_opp.message_content,
            "expected_revenue": new_opp.expected_revenue,
            "confidence": new_opp.confidence,
            "rules": new_opp.rules_json,
            "customers": [
                {
                    "id": c.id,
                    "name": c.name,
                    "churn_risk_score": c.churn_risk_score,
                    "total_spend": c.total_spend,
                    "reason": _generate_reason(c, new_opp.rules_json)
                } for c in matched_customers
            ]
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@copilot_bp.route('/campaign-opportunity/<int:id>/consume', methods=['POST'])
def consume_campaign_opportunity(id):
    try:
        opp = AICampaignOpportunity.query.get_or_404(id)
        opp.status = 'consumed'
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

def _evaluate_rules(customers, rules):
    if not rules:
        return customers
    matched = []
    for c in customers:
        matches_all = True
        for rule in rules:
            field = rule.get('field')
            operator = rule.get('operator')
            value = rule.get('value')
            
            c_val = getattr(c, field, None)
            
            # Special logic for days_since_active
            if field == 'days_since_active' and c.last_active:
                c_val = (datetime.utcnow() - c.last_active).days
            elif field == 'days_since_active':
                c_val = 0
                
            if c_val is None:
                matches_all = False
                break
                
            if operator == '>=' and not (c_val >= value): matches_all = False
            elif operator == '<=' and not (c_val <= value): matches_all = False
            elif operator == '==' and not (c_val == value): matches_all = False
            elif operator == '>' and not (c_val > value): matches_all = False
            elif operator == '<' and not (c_val < value): matches_all = False
            
        if matches_all:
            matched.append(c)
    return matched

def _generate_reason(customer, rules):
    reasons = []
    for r in rules:
        if r.get('field') == 'churn_risk_score':
            reasons.append(f"Churn risk is {customer.churn_risk_score}%")
        elif r.get('field') == 'total_spend':
            reasons.append(f"Total spend is ${customer.total_spend}")
        elif r.get('field') == 'days_since_active' and customer.last_active:
            reasons.append(f"Inactive for {(datetime.utcnow() - customer.last_active).days} days")
    return " and ".join(reasons) if reasons else "Matched AI criteria"

@copilot_bp.route('/opportunities', methods=['GET'])
def get_opportunities():
    try:
        # Check for existing pending opportunity
        pending_opp = AIOpportunity.query.filter_by(status='pending').order_by(AIOpportunity.created_at.desc()).first()
        if pending_opp:
            return jsonify({
                "id": pending_opp.id,
                "segmentName": pending_opp.segment_name,
                "reason": pending_opp.reason,
                "rules": pending_opp.rules_json,
                "estimatedAudience": pending_opp.estimated_audience,
                "estimatedRecovery": pending_opp.estimated_recovery,
                "confidence": pending_opp.confidence,
                "status": pending_opp.status
            })

        # Build aggregate customer data
        customers = Customer.query.all()
        high_risk_customers = [c for c in customers if c.churn_risk_category == 'High']
        medium_risk_customers = [c for c in customers if c.churn_risk_category == 'Medium']
        
        # Exclude both created segments and previously consumed/dismissed opportunities
        existing_segments = Segment.query.all()
        existing_segment_names = [s.name for s in existing_segments]
        
        past_opps = AIOpportunity.query.all()
        past_opp_names = [o.segment_name for o in past_opps]
        
        all_excluded_names = list(set(existing_segment_names + past_opp_names))
        
        data_summary = {
            "total_customers": len(customers),
            "high_risk_customers": {
                "count": len(high_risk_customers),
                "potential_recovery_revenue": sum((c.avg_order_value or 0) for c in high_risk_customers)
            },
            "medium_risk_customers": {
                "count": len(medium_risk_customers),
                "potential_recovery_revenue": sum((c.avg_order_value or 0) for c in medium_risk_customers)
            },
            "existing_segments": all_excluded_names
        }
        
        ai_response = ai_service.analyze_opportunities(data_summary)
        
        # Save new opportunity to database
        new_opp = AIOpportunity(
            segment_name=ai_response.get("segmentName", "New Segment"),
            reason=ai_response.get("reason", ""),
            rules_json=ai_response.get("rules", []),
            estimated_audience=ai_response.get("estimatedAudience", 0),
            estimated_recovery=ai_response.get("estimatedRecovery", 0.0),
            confidence=ai_response.get("confidence", 0.0),
            status='pending'
        )
        db.session.add(new_opp)
        db.session.commit()
        
        ai_response["id"] = new_opp.id
        ai_response["status"] = new_opp.status
        
        return jsonify(ai_response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@copilot_bp.route('/generate-journey', methods=['POST'])
def generate_journey():
    data = request.json
    prompt_text = data.get('prompt', '')
    
    customers = Customer.query.all()
    high_risk = len([c for c in customers if c.churn_risk_category == 'High'])
    total_spend = sum((c.total_spend or 0) for c in customers)
    
    data_summary = {
        "total_customers": len(customers),
        "high_risk_customers_count": high_risk,
        "total_revenue": total_spend
    }
    
    ai_response = ai_service.generate_journey(prompt_text, data_summary)
    if not ai_response:
        return jsonify({"error": "AI insights temporarily unavailable."}), 503
        
    rules = ai_response.get("rules", [])
    matched_customers = _evaluate_rules(customers, rules)
    
    customers_data = [{
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "total_spend": float(c.total_spend) if c.total_spend else 0.0,
        "churn_risk_category": c.churn_risk_category,
        "churn_risk_score": c.churn_risk_score,
        "reason": _generate_reason(c, rules)
    } for c in matched_customers]
    
    ai_response["audience"] = {
        "count": len(matched_customers),
        "customers": customers_data
    }
    
    return jsonify(ai_response)

@copilot_bp.route('/preview-segment', methods=['POST'])
def preview_segment():
    try:
        data = request.json
        rules = data.get('rules', [])
        
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

            elif field == "churn_risk_category":
                if operator == "equals" or operator == "Equals":
                    query = query.filter(Customer.churn_risk_category.ilike(f"{value}"))

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
        
        return jsonify({"customers": data, "count": len(data)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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

def _build_rules_query(rules):
    if isinstance(rules, str):
        import json
        try:
            rules = json.loads(rules)
        except:
            rules = []
            
    query = Customer.query
    for rule in rules:
        if not isinstance(rule, dict): continue
        field = rule.get("field")
        operator = rule.get("operator")
        value = rule.get("value")
        
        if field in ["city", "City"]:
            if operator in ["equals", "Equals"]: query = query.filter(Customer.city.ilike(f"{value}"))
            elif operator in ["contains", "Contains"]: query = query.filter(Customer.city.ilike(f"%{value}%"))
            elif operator == "Not equals": query = query.filter(Customer.city.ilike(f"{value}") == False)
                
        elif field in ["total_spend", "Total Spend", "ltv", "LTV"]:
            try:
                v = float(value)
                if operator in ["equals", "Equals"]: query = query.filter(Customer.total_spend == v)
                elif operator in [">", "Is greater than"]: query = query.filter(Customer.total_spend > v)
                elif operator in [">="]: query = query.filter(Customer.total_spend >= v)
                elif operator in ["<", "Is less than"]: query = query.filter(Customer.total_spend < v)
                elif operator in ["<="]: query = query.filter(Customer.total_spend <= v)
            except: pass
            
        elif field in ["order_count", "Order Count"]:
            try:
                v = int(value)
                if operator in ["equals", "Equals"]: query = query.filter(Customer.order_count == v)
                elif operator in [">", "Is greater than"]: query = query.filter(Customer.order_count > v)
                elif operator in [">="]: query = query.filter(Customer.order_count >= v)
                elif operator in ["<", "Is less than"]: query = query.filter(Customer.order_count < v)
                elif operator in ["<="]: query = query.filter(Customer.order_count <= v)
            except: pass
            
        elif field in ["days_since_last_purchase", "days_since_purchase", "Last Active"]:
            try:
                v = int(value)
                target_date = datetime.utcnow() - timedelta(days=v)
                if operator in [">", ">=", "More than X days ago"]: query = query.filter(Customer.last_active <= target_date)
                elif operator in ["<", "<=", "Less than X days ago"]: query = query.filter(Customer.last_active >= target_date)
            except: pass

        elif field == "churn_risk_score":
            try:
                v = float(value)
                v_scaled = v / 100.0 if v > 1.0 else v
                if operator in [">=", ">"]: query = query.filter(db.or_(Customer.churn_risk_score >= v, Customer.churn_risk_score >= v_scaled))
                elif operator in ["<=", "<"]: query = query.filter(db.or_(Customer.churn_risk_score <= v, Customer.churn_risk_score <= v_scaled))
            except: pass

        elif field == "churn_risk_category":
            if operator in ["equals", "Equals", "=="]: query = query.filter(Customer.churn_risk_category.ilike(f"{value}"))
            elif operator in ["Not equals", "!="]: query = query.filter(Customer.churn_risk_category.ilike(f"{value}") == False)

    return query

def evaluate_rules_and_get_count(rules):
    return _build_rules_query(rules).count()

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
            new_campaign = Campaign(
                name=camp_data.get("campaign_name", "AI Campaign"),
                segment_id=new_seg.id,
                channel=camp_data.get("recommended_channel", "Email"),
                message=camp_data.get("message_content", ""),
                status="active",
                messages_sent=0,
                messages_delivered=0,
                messages_opened=0,
                messages_clicked=0,
                conversions=0,
                revenue_generated=0.0
            )
            db.session.add(new_campaign)
            db.session.flush()

            # Using same realistic random logic from campaigns.py
            target_customers = _build_rules_query(rules).all()
            messages_sent = 0
            messages_delivered = 0
            messages_opened = 0
            messages_clicked = 0
            conversions = 0
            revenue_generated = 0.0
            now = datetime.utcnow()
            
            import random
            from datetime import timedelta
            
            for cust in target_customers:
                db.session.add(CommunicationLog(campaign_id=new_campaign.id, customer_id=cust.id, event_type='sent', timestamp=now))
                messages_sent += 1
                
                delay = timedelta(minutes=random.randint(1, 15))
                if random.random() < 0.88:
                    db.session.add(CommunicationLog(campaign_id=new_campaign.id, customer_id=cust.id, event_type='delivered', timestamp=now+delay))
                    messages_delivered += 1
                    
                    delay += timedelta(minutes=random.randint(5, 60))
                    if random.random() < 0.65:
                        db.session.add(CommunicationLog(campaign_id=new_campaign.id, customer_id=cust.id, event_type='opened', timestamp=now+delay))
                        messages_opened += 1
                        
                        delay += timedelta(minutes=random.randint(2, 30))
                        if random.random() < 0.29:
                            db.session.add(CommunicationLog(campaign_id=new_campaign.id, customer_id=cust.id, event_type='clicked', timestamp=now+delay))
                            messages_clicked += 1
                            
                            delay += timedelta(minutes=random.randint(10, 120))
                            if random.random() < 0.80:
                                db.session.add(CommunicationLog(campaign_id=new_campaign.id, customer_id=cust.id, event_type='converted', timestamp=now+delay))
                                conversions += 1
                                rev = random.choice([49.99, 99.99, 149.99, 299.99])
                                revenue_generated += rev
            
            new_campaign.messages_sent = messages_sent
            new_campaign.messages_delivered = messages_delivered
            new_campaign.messages_opened = messages_opened
            new_campaign.messages_clicked = messages_clicked
            new_campaign.conversions = conversions
            new_campaign.revenue_generated = revenue_generated
            
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
            query = _build_rules_query(rules)
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
        customers = Customer.query.all()

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
            campaign_name=str(ai_response.get("campaign_name", "New Campaign"))[:255],
            objective=str(ai_response.get("objective", ""))[:255],
            target_audience=str(ai_response.get("target_audience", ""))[:255],
            recommended_channel=str(ai_response.get("recommended_channel", "Email"))[:50],
            subject_line=str(ai_response.get("subject_line", ""))[:255],
            message_content=ai_response.get("message_content", ""),
            expected_revenue=ai_response.get("expected_revenue", 0.0),
            confidence=ai_response.get("confidence", 0.9),
            rules_json=ai_response.get("rules", []),
            status='pending'
        )
        db.session.add(new_opp)
        db.session.commit()
        
        matched_customers = _build_rules_query(new_opp.rules_json).all()
        
        # Fallback if AI hallucinates an invalid segment (0 customers or ALL customers)
        total_customers_in_db = Customer.query.count()
        if len(matched_customers) == 0 or len(matched_customers) == total_customers_in_db:
            new_opp.rules_json = [{"field": "churn_risk_score", "operator": ">=", "value": 50}]
            db.session.commit()
            matched_customers = _build_rules_query(new_opp.rules_json).all()
            if len(matched_customers) == 0:
                matched_customers = Customer.query.limit(10).all()
        
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
        # Build comprehensive aggregate customer data
        customers = Customer.query.all()
        orders = Order.query.all()
        campaigns = Campaign.query.all()
        
        # Inactivity & recent purchases
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        inactive_customers = [c for c in customers if c.last_active and c.last_active < thirty_days_ago]
        first_time_customers = [c for c in customers if c.order_count == 1]
        
        data_summary = {
            "total_customers": len(customers),
            "high_risk_customers": len([c for c in customers if c.churn_risk_category == 'High']),
            "total_revenue": sum(o.amount for o in orders if o.status == 'completed' and o.amount),
            "inactive_customers_30_days": len(inactive_customers),
            "first_time_customers": len(first_time_customers),
            "campaign_performance": {
                "total_campaigns": len(campaigns),
                "total_messages_sent": sum((c.messages_sent or 0) for c in campaigns),
                "total_campaign_revenue": sum((c.revenue_generated or 0) for c in campaigns)
            }
        }
        
        ai_response = ai_service.analyze_opportunities(data_summary)
        
        # 1. Parse the rules
        rules = ai_response.get("generatedRules", [])
        if isinstance(rules, str):
            import json
            try:
                rules = json.loads(rules)
            except:
                rules = []
        
        # 2. Deterministically fetch matching customers
        query = _build_rules_query(rules)
        matching_customers = query.all()
        
        # 3. Fallback if AI hallucinates an invalid segment (0 customers or ALL customers)
        total_customers_in_db = Customer.query.count()
        if len(matching_customers) == 0 or len(matching_customers) == total_customers_in_db:
            rules = [{"field": "churn_risk_category", "operator": "equals", "value": "High"}]
            query = _build_rules_query(rules)
            matching_customers = query.all()
            if len(matching_customers) == 0:
                # Absolute fallback if no high risk customers exist
                matching_customers = Customer.query.limit(10).all()
        
        customer_count = len(matching_customers)
        
        # 4. Calculate Potential Recovery (e.g. LTV * ChurnRisk / 100)
        potential_recovery = sum(
            ((c.total_spend or 0) * ((c.churn_risk_score or 0) / 100.0)) 
            for c in matching_customers
        )
        
        # 5. Calculate dynamic Confidence score based on data quality
        # Base 70, +10 if size is reasonable, + up to 15 based on average churn risk
        base_confidence = 70.0
        size_bonus = 10.0 if 5 <= customer_count <= 50 else 5.0
        avg_churn = sum((c.churn_risk_score or 0) for c in matching_customers) / max(customer_count, 1)
        churn_bonus = min(15.0, avg_churn / 100.0 * 15.0)
        confidence = round(base_confidence + size_bonus + churn_bonus, 1)
        
        # Map AI Response to the DB Model deterministically
        new_opp = AIOpportunity(
            title=str(ai_response.get("title", "AI Generated Opportunity"))[:255],
            segment_name=str(ai_response.get("recommendedSegmentName", "New AI Segment"))[:255],
            reason=ai_response.get("reasoning", ""),
            rules_json=rules,
            estimated_audience=customer_count,
            estimated_recovery=potential_recovery,
            confidence=confidence,
            status='pending'
        )
        db.session.add(new_opp)
        db.session.commit()
        
        return jsonify({
            "id": new_opp.id,
            "title": new_opp.title,
            "recommendedSegmentName": new_opp.segment_name,
            "reasoning": new_opp.reason,
            "generatedRules": new_opp.rules_json,
            "customerCount": new_opp.estimated_audience,
            "potentialRecovery": new_opp.estimated_recovery,
            "confidence": new_opp.confidence,
            "status": new_opp.status,
            "created_at": new_opp.created_at.isoformat()
        })
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
    matched_customers = _build_rules_query(rules).all()
    
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
        
        if isinstance(rules, str):
            import json
            try:
                rules = json.loads(rules)
            except:
                rules = []
        
        query = _build_rules_query(rules)
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


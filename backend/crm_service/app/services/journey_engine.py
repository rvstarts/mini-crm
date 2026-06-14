from app.models import db, Journey, JourneyState, Customer, CommunicationLog, Campaign
from datetime import datetime, timedelta
import json

class JourneyEngine:
    
    @classmethod
    def activate_journey(cls, journey_id):
        journey = Journey.query.get(journey_id)
        if not journey: return {"error": "Not found"}

        nodes = journey.nodes_json
        trigger_nodes = [n for n in nodes if n.get('type') == 'trigger']
        if not trigger_nodes:
            return {"error": "No trigger node"}

        trigger = trigger_nodes[0]
        trigger_label = trigger.get('data', {}).get('label', '')

        eligible_customers = []
        all_customers = Customer.query.all()
        
        # Audience Identification Logic
        for c in all_customers:
            if trigger_label == 'High Churn Risk' and c.churn_risk_score and c.churn_risk_score >= 0.7:
                eligible_customers.append(c)
            elif trigger_label == 'VIP Customer' and c.total_spend >= 1000: # Threshold example
                eligible_customers.append(c)
            elif trigger_label == 'No Purchase 30 Days':
                if c.last_active and (datetime.utcnow() - c.last_active).days >= 30:
                    eligible_customers.append(c)
            elif trigger_label == 'Cart Abandoned':
                # Mock: we'd check cart status, assuming anyone with no orders recently
                if c.last_active and (datetime.utcnow() - c.last_active).days < 3 and c.order_count == 0:
                    eligible_customers.append(c)
            elif trigger_label == 'Purchase Completed':
                if c.last_active and (datetime.utcnow() - c.last_active).days < 2 and c.order_count > 0:
                    eligible_customers.append(c)
            elif trigger_label == 'All Customers' or trigger_label == 'Segment Entered':
                # Simplified segment behavior, adds everyone
                eligible_customers.append(c)
            else:
                pass # Default

        # Fallback to ensure demo always works
        if not eligible_customers and all_customers:
            pass # Removed random fallback per requirements

        added_count = 0
        for ec in eligible_customers:
            existing_state = JourneyState.query.filter_by(journey_id=journey.id, customer_id=ec.id).first()
            if not existing_state:
                new_state = JourneyState(
                    journey_id=journey.id,
                    customer_id=ec.id,
                    current_node_id=trigger.get('id'),
                    status='active'
                )
                db.session.add(new_state)
                added_count += 1
                
        # Also create a dummy campaign to hold the comm logs
        dummy_camp = Campaign.query.filter_by(name=journey.name).first()
        if not dummy_camp:
            dummy_camp = Campaign(name=journey.name, channel='journey', status='active')
            db.session.add(dummy_camp)

        journey.status = 'active'
        journey.customers_entered = added_count
        db.session.commit()
        return {"message": "Activated", "participants_added": added_count}

    @classmethod
    def run_tick(cls):
        """
        Simulates a cron execution tick.
        Evaluates active JourneyStates to move them through nodes.
        """
        stats = {
            "new_states_created": 0,
            "nodes_processed": 0,
            "actions_dispatched": 0,
            "journeys_completed": 0
        }

        
        # 2. Process active JourneyStates
        active_states = JourneyState.query.filter_by(status='active').all()
        for state in active_states:
            # Check if waiting
            if state.resume_at and state.resume_at > datetime.utcnow():
                continue
                
            state.resume_at = None # Clear wait
            journey = Journey.query.get(state.journey_id)
            customer = Customer.query.get(state.customer_id)
            nodes = journey.nodes_json
            edges = journey.edges_json
            
            current_node = next((n for n in nodes if n.get('id') == state.current_node_id), None)
            if not current_node:
                state.status = 'completed'
                continue
                
            node_type = current_node.get('type')
            node_data = current_node.get('data', {})
            
            stats["nodes_processed"] += 1
            
            # Process Node Types
            if node_type == 'action':
                # Create a CommunicationLog based on action type
                action_type = node_data.get('type', 'whatsapp')
                
                # Fetch dummy campaign
                dummy_camp = Campaign.query.filter_by(name=journey.name).first()
                if not dummy_camp:
                    dummy_camp = Campaign(name=journey.name, channel=action_type, status='active')
                    db.session.add(dummy_camp)
                    db.session.flush()
                
                log = CommunicationLog(
                    campaign_id=dummy_camp.id,
                    customer_id=customer.id,
                    event_type='sent',
                    timestamp=datetime.utcnow()
                )
                db.session.add(log)
                
                # Fast delivery/open simulation for timeline
                log_delivered = CommunicationLog(
                    campaign_id=dummy_camp.id,
                    customer_id=customer.id,
                    event_type='delivered',
                    timestamp=datetime.utcnow() + timedelta(minutes=1)
                )
                db.session.add(log_delivered)

                # Removed simulated opens and clicks per requirements
                stats["actions_dispatched"] += 1
                journey.messages_sent += 1
                journey.messages_delivered += 1
                
            elif node_type == 'delay':
                # Parse wait time from label
                label = node_data.get('label', '').lower()
                minutes_delay = 0
                if 'minute' in label:
                    try: minutes_delay = int(''.join(filter(str.isdigit, label)))
                    except: minutes_delay = 1
                elif 'hour' in label:
                    try: minutes_delay = int(''.join(filter(str.isdigit, label))) * 60
                    except: minutes_delay = 60
                elif 'day' in label:
                    try: minutes_delay = int(''.join(filter(str.isdigit, label))) * 60 * 24
                    except: minutes_delay = 60 * 24
                
                if minutes_delay == 0: minutes_delay = 1
                
                # For demo purposes, we will scale delays down massively 
                # (1 day = 1 minute simulation, 1 hour = 10 secs)
                # But to just let the user see it progress during demo, we reduce delays to seconds
                if 'day' in label: scaled_secs = 5
                elif 'hour' in label: scaled_secs = 2
                else: scaled_secs = 1
                
                state.resume_at = datetime.utcnow() + timedelta(seconds=scaled_secs)
                
            elif node_type == 'condition':
                condition_label = node_data.get('label', '')
                passed = False
                if 'Purchased?' in condition_label:
                    if customer.order_count > 0: passed = True
                elif 'Opened?' in condition_label:
                    passed = False # Real open tracking required
                else:
                    passed = True
                
                source_handle = 'yes' if passed else 'no'
                next_edges = [e for e in edges if e.get('source') == state.current_node_id and e.get('sourceHandle') == source_handle]
                if next_edges:
                    state.current_node_id = next_edges[0].get('target')
                    continue 
                
            # Find next node for generic sequence
            if node_type != 'condition':
                next_edges = [e for e in edges if e.get('source') == state.current_node_id]
                if next_edges:
                    state.current_node_id = next_edges[0].get('target')
                else:
                    # No next node, journey is complete
                    state.status = 'completed'
                    stats["journeys_completed"] += 1
                    
        db.session.commit()
        return stats

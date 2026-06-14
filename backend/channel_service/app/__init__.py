from flask import Flask

def create_app():
    app = Flask(__name__)
    
    import threading
    import time
    import requests
    from flask import request, jsonify

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    def delivery_worker(campaign_id, customer_id):
        # Simulated lifecycle events with delays
        events = ['sent', 'delivered', 'opened', 'clicked']
        
        for event in events:
            time.sleep(3) # 3 seconds between events
            
            # Fire webhook back to CRM
            payload = {
                "campaign_id": campaign_id,
                "customer_id": customer_id,
                "event_type": event
            }
            
            # Simple retry loop
            for _ in range(3):
                try:
                    res = requests.post('http://localhost:5000/api/webhooks/channel-event', json=payload, timeout=5)
                    if res.status_code == 200:
                        break
                except Exception as e:
                    print(f"Webhook failed for {event}, retrying... {e}")
                    time.sleep(2)

    @app.route('/api/send', methods=['POST'])
    def send_message():
        data = request.json
        campaign_id = data.get('campaign_id')
        customer_id = data.get('customer_id')
        
        if not campaign_id:
            return jsonify({"error": "campaign_id required"}), 400
            
        # Spawn background worker
        thread = threading.Thread(target=delivery_worker, args=(campaign_id, customer_id))
        thread.daemon = True
        thread.start()
        
        return jsonify({"status": "accepted", "message": "Delivery process started"}), 202

    return app

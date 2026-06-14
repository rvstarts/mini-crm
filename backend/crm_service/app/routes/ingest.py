from flask import Blueprint, jsonify, request
from app.models import db, Customer, Order

ingest_bp = Blueprint('ingest', __name__)

@ingest_bp.route('/', methods=['POST'])
def ingest_data():
    """
    Ingest data API
    Takes in a payload of customers and their associated orders,
    saves the customers to the database, saves their orders,
    and updates their total_spend and order_count automatically.
    """
    payload = request.json
    if not payload or 'data' not in payload:
        return jsonify({"error": "Invalid payload format. Expected {'data': [...]}"}), 400
        
    data = payload['data']
    
    ingested_customers = 0
    ingested_orders = 0
    
    for item in data:
        cust_data = item.get('customer')
        orders_data = item.get('orders', [])
        
        if not cust_data or 'email' not in cust_data:
            continue # Skip invalid data
            
        # Check if customer already exists by email
        customer = Customer.query.filter_by(email=cust_data['email']).first()
        
        if not customer:
            customer = Customer(
                name=cust_data.get('name'),
                email=cust_data['email'],
                phone=cust_data.get('phone'),
                city=cust_data.get('city'),
                total_spend=0,
                order_count=0
            )
            db.session.add(customer)
            db.session.flush() # Get the new customer.id
            ingested_customers += 1
            
        # Process and store the orders for this customer
        for o_data in orders_data:
            amount = float(o_data.get('amount', 0))
            order = Order(
                customer_id=customer.id,
                amount=amount,
                category=o_data.get('category', 'General'),
                channel=o_data.get('channel', 'Web')
            )
            db.session.add(order)
            
            # Update customer metrics
            customer.total_spend += amount
            customer.order_count += 1
            ingested_orders += 1
            
        # Recalculate average order value
        if customer.order_count > 0:
            customer.avg_order_value = customer.total_spend / customer.order_count
            
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": f"Successfully ingested {ingested_customers} new customers and {ingested_orders} orders."
    }), 201

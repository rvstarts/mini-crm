from flask import Blueprint, jsonify, request
from app.models import db, Order

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['GET'])
def get_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    data = [{
        "id": o.id,
        "customer_id": o.customer_id,
        "amount": o.amount,
        "category": o.category,
        "status": o.status,
        "channel": o.channel,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    } for o in orders]
    return jsonify(data)

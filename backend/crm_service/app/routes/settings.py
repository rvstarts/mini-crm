from flask import Blueprint, request, jsonify
from app.models import db, UserAccount, AccountSettings
from functools import wraps
import re
import secrets
from datetime import datetime

bp = Blueprint('settings', __name__)

# Very simple token-based auth for demo purposes
DEMO_TOKEN = "Bearer default-demo-user-token"

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or token != DEMO_TOKEN:
            return jsonify({'error': 'Unauthorized', 'message': 'Invalid or missing authentication token.'}), 401
        
        # Get or create the default user for demo purposes
        user = UserAccount.query.filter_by(email="bella@pulsecrm.com").first()
        if not user:
            user = UserAccount(
                first_name="Bella",
                last_name="Williamson",
                email="bella@pulsecrm.com",
                role="Marketing Admin",
                api_key=f"pk_live_{secrets.token_hex(16)}"
            )
            db.session.add(user)
            db.session.flush()
            
            settings = AccountSettings(
                user_id=user.id,
                ai_config_json={
                    "provider": "OpenAI",
                    "model": "GPT-4o",
                    "temperature": 0.7,
                    "segmentGeneration": True,
                    "campaignGeneration": True,
                    "journeyGeneration": True,
                    "revenuePrediction": True
                },
                channel_config_json={
                    "email": {"connected": True, "simulationMode": True, "deliveryRate": 92, "openRate": 41, "clickRate": 12},
                    "whatsapp": {"connected": True, "simulationMode": True, "deliveryRate": 95, "readRate": 78}
                },
                notifications_json={
                    "journeyCompleted": True,
                    "campaignCreated": True,
                    "segmentGenerated": True,
                    "highChurnAlert": True,
                    "aiRecommendation": True
                },
                ai_learning_json={
                    "learnCampaigns": True,
                    "learnSegments": True,
                    "learnJourneys": True,
                    "confidenceThreshold": 85
                }
            )
            db.session.add(settings)
            db.session.commit()
            
        return f(user, *args, **kwargs)
    return decorated

@bp.route('/profile', methods=['GET'])
@auth_required
def get_profile(user):
    return jsonify({
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "role": user.role,
        "avatarUrl": user.avatar_url,
        "lastLogin": user.last_login.isoformat() if user.last_login else "Never",
        "createdAt": user.created_at.isoformat()
    })

@bp.route('/profile', methods=['PUT'])
@auth_required
def update_profile(user):
    data = request.json
    
    # Validation
    if 'email' in data:
        email = data['email']
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({'error': 'Validation Error', 'message': 'Invalid email address format.'}), 400
        user.email = email
        
    if 'firstName' in data and data['firstName'].strip():
        user.first_name = data['firstName']
    if 'lastName' in data and data['lastName'].strip():
        user.last_name = data['lastName']
    if 'role' in data:
        user.role = data['role']
    if 'avatarUrl' in data:
        user.avatar_url = data['avatarUrl']
        
    db.session.commit()
    return jsonify({"message": "Profile updated successfully"})

@bp.route('/security/password', methods=['PUT'])
@auth_required
def update_password(user):
    data = request.json
    new_password = data.get('new')
    
    if not new_password or len(new_password) < 8:
        return jsonify({'error': 'Validation Error', 'message': 'Password must be at least 8 characters long.'}), 400
        
    # In a real app we'd hash this using bcrypt, mock for now
    user.password_hash = new_password
    db.session.commit()
    return jsonify({"message": "Password updated successfully"})

@bp.route('/security/api-key', methods=['POST'])
@auth_required
def generate_api_key(user):
    user.api_key = f"pk_live_{secrets.token_hex(16)}"
    db.session.commit()
    return jsonify({"api_key": user.api_key})

@bp.route('/security/api-key', methods=['GET'])
@auth_required
def get_api_key(user):
    return jsonify({"api_key": user.api_key})

@bp.route('/config', methods=['GET'])
@auth_required
def get_config(user):
    settings = user.settings
    if not settings:
        return jsonify({'error': 'Settings not found'}), 404
        
    return jsonify({
        "aiConfig": settings.ai_config_json,
        "channelService": settings.channel_config_json,
        "notifications": settings.notifications_json,
        "aiLearning": settings.ai_learning_json
    })

@bp.route('/config', methods=['PUT'])
@auth_required
def update_config(user):
    data = request.json
    settings = user.settings
    
    if not settings:
        settings = AccountSettings(user_id=user.id)
        db.session.add(settings)
        
    if 'aiConfig' in data:
        settings.ai_config_json = data['aiConfig']
    if 'channelService' in data:
        settings.channel_config_json = data['channelService']
    if 'notifications' in data:
        settings.notifications_json = data['notifications']
    if 'aiLearning' in data:
        settings.ai_learning_json = data['aiLearning']
        
    db.session.commit()
    return jsonify({"message": "Configuration updated successfully"})

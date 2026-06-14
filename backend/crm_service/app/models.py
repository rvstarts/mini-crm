from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class UserAccount(db.Model):
    __tablename__ = 'user_accounts'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    role = db.Column(db.String(50), default='Marketing Admin')
    avatar_url = db.Column(db.Text, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True) # for basic auth demo
    api_key = db.Column(db.String(100), unique=True, nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    settings = db.relationship('AccountSettings', backref='user', lazy=True, uselist=False, cascade='all, delete-orphan')

class AccountSettings(db.Model):
    __tablename__ = 'account_settings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user_accounts.id'), nullable=False)
    ai_config_json = db.Column(db.JSON, nullable=True)
    channel_config_json = db.Column(db.JSON, nullable=True)
    notifications_json = db.Column(db.JSON, nullable=True)
    ai_learning_json = db.Column(db.JSON, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(50))
    city = db.Column(db.String(100))
    
    total_spend = db.Column(db.Float, default=0.0)
    order_count = db.Column(db.Integer, default=0)
    avg_order_value = db.Column(db.Float, default=0.0)
    
    last_active = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    churn_risk_score = db.Column(db.Float)
    churn_risk_category = db.Column(db.String(50))
    churn_risk_reason = db.Column(db.Text)
    churn_risk_recommendation = db.Column(db.Text)
    churn_risk_generated_at = db.Column(db.DateTime)
    predicted_ltv = db.Column(db.Float)

    orders = db.relationship('Order', backref='customer', lazy=True)
    campaigns = db.relationship('Campaign', backref='customer', lazy=True)
    ai_analysis = db.relationship('CustomerAiAnalysis', backref='customer', lazy=True, uselist=False, cascade='all, delete-orphan')

class CustomerAiAnalysis(db.Model):
    __tablename__ = 'customer_ai_analysis'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    predicted_ltv = db.Column(db.Float, nullable=True)
    risk_score = db.Column(db.Integer, nullable=True)
    risk_level = db.Column(db.String(50), nullable=True)
    reason = db.Column(db.Text, nullable=True)
    recommended_action = db.Column(db.Text, nullable=True)
    best_channel = db.Column(db.String(50), nullable=True)
    next_best_offer = db.Column(db.Text, nullable=True)
    confidence = db.Column(db.Integer, nullable=True)
    model_used = db.Column(db.String(100), nullable=True)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    channel = db.Column(db.String(50))
    status = db.Column(db.String(50), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Segment(db.Model):
    __tablename__ = 'segments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    rules_json = db.Column(db.JSON, nullable=False)
    audience_count = db.Column(db.Integer, default=0)
    journey_id = db.Column(db.Integer, db.ForeignKey('journeys.id'), nullable=True)
    ai_reasoning = db.Column(db.Text, nullable=True)
    estimated_recovery = db.Column(db.Float, default=0.0)
    recommended_campaign = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    segment_id = db.Column(db.Integer, db.ForeignKey('segments.id'), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    template_id = db.Column(db.Integer, db.ForeignKey('templates.id'), nullable=True)
    channel = db.Column(db.String(50))
    message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='draft') # draft, active, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Delivery & Tracking Metrics
    messages_sent = db.Column(db.Integer, default=0)
    messages_delivered = db.Column(db.Integer, default=0)
    messages_opened = db.Column(db.Integer, default=0)
    messages_clicked = db.Column(db.Integer, default=0)
    conversions = db.Column(db.Integer, default=0)
    revenue_generated = db.Column(db.Float, default=0.0)

    logs = db.relationship('CommunicationLog', backref='campaign', lazy=True, cascade='all, delete-orphan')

class CommunicationLog(db.Model):
    __tablename__ = 'communication_logs'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    event_type = db.Column(db.String(50), nullable=False) # generated, sent, delivered, opened, clicked, redeemed, failed
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Journey(db.Model):
    __tablename__ = 'journeys'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='draft') # draft, active, inactive
    nodes_json = db.Column(db.JSON, nullable=False, default=list)
    edges_json = db.Column(db.JSON, nullable=False, default=list)
    
    # Analytics
    customers_entered = db.Column(db.Integer, default=0)
    messages_sent = db.Column(db.Integer, default=0)
    messages_delivered = db.Column(db.Integer, default=0)
    messages_opened = db.Column(db.Integer, default=0)
    messages_clicked = db.Column(db.Integer, default=0)
    conversions = db.Column(db.Integer, default=0)
    revenue_generated = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class JourneyState(db.Model):
    __tablename__ = 'journey_states'
    id = db.Column(db.Integer, primary_key=True)
    journey_id = db.Column(db.Integer, db.ForeignKey('journeys.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    current_node_id = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='active') # active, waiting, completed, exited
    resume_at = db.Column(db.DateTime, nullable=True) # Used for wait steps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIOpportunity(db.Model):
    __tablename__ = 'ai_opportunities'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=True)
    segment_name = db.Column(db.String(255), nullable=False)
    reason = db.Column(db.Text)
    rules_json = db.Column(db.JSON, nullable=False)
    estimated_audience = db.Column(db.Integer, default=0)
    estimated_recovery = db.Column(db.Float, default=0.0)
    confidence = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default='pending') # pending, consumed, dismissed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AICampaignOpportunity(db.Model):
    __tablename__ = 'ai_campaign_opportunities'
    id = db.Column(db.Integer, primary_key=True)
    campaign_name = db.Column(db.String(255), nullable=False)
    objective = db.Column(db.String(255))
    target_audience = db.Column(db.String(255))
    recommended_channel = db.Column(db.String(50))
    subject_line = db.Column(db.String(255))
    message_content = db.Column(db.Text)
    expected_revenue = db.Column(db.Float, default=0.0)
    confidence = db.Column(db.Float, default=0.0)
    rules_json = db.Column(db.JSON, nullable=False, default=list)
    status = db.Column(db.String(50), default='pending') # pending, consumed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Template(db.Model):
    __tablename__ = 'templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), default="Newsletter")
    subject_line = db.Column(db.String(255), nullable=True)
    preheader = db.Column(db.String(255), nullable=True)
    thumbnail = db.Column(db.Text, nullable=True)
    html_content = db.Column(db.Text, nullable=True)
    json_content = db.Column(db.JSON, nullable=False, default=list)
    versions_json = db.Column(db.JSON, nullable=True, default=list)
    times_used = db.Column(db.Integer, default=0)
    messages_sent = db.Column(db.Integer, default=0)
    messages_delivered = db.Column(db.Integer, default=0)
    messages_opened = db.Column(db.Integer, default=0)
    messages_clicked = db.Column(db.Integer, default=0)
    conversion_rate = db.Column(db.Float, default=0.0)
    revenue_generated = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(100), default='system')


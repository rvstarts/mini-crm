from flask import Flask
from flask_cors import CORS
from .models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    CORS(app)
    db.init_app(app)
    
    with app.app_context():
        db.create_all()

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    from .routes.customers import customers_bp
    from .routes.orders import orders_bp
    from .routes.segments import segments_bp
    from .routes.campaigns import campaigns_bp
    from .routes.analytics import analytics_bp
    from .routes.communications import communications_bp
    from .routes.copilot import copilot_bp
    from .routes.ingest import ingest_bp
    from .routes.webhooks import webhooks_bp
    from .routes.journeys import bp as journeys_bp
    from .routes.settings import bp as settings_bp
    from .routes.search import bp as search_bp
    from .routes.templates import bp as templates_bp

    app.register_blueprint(customers_bp, url_prefix='/api/customers')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(segments_bp, url_prefix='/api/segments')
    app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(communications_bp, url_prefix='/api/communications')
    app.register_blueprint(copilot_bp, url_prefix='/api/copilot')
    app.register_blueprint(ingest_bp, url_prefix='/api/ingest')
    app.register_blueprint(webhooks_bp, url_prefix='/api/webhooks')
    app.register_blueprint(journeys_bp, url_prefix='/api/journeys')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(templates_bp, url_prefix='/api/templates')

    return app

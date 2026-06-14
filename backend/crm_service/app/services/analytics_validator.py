import logging
from app.models import db, Campaign, Customer, CommunicationLog, Segment

logging.basicConfig(level=logging.WARNING, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class AnalyticsValidator:
    @staticmethod
    def validate():
        # Check segment count vs campaign count (conceptual, assuming 1:1 for this app's logic)
        campaigns = Campaign.query.all()
        for c in campaigns:
            if c.segment_id:
                seg = Segment.query.get(c.segment_id)
                if not seg:
                    logger.warning(f"Campaign {c.id} has orphaned segment_id {c.segment_id}")
            
            # sent >= delivered >= opened >= clicked >= converted
            if not (c.messages_sent >= c.messages_delivered >= c.messages_opened >= c.messages_clicked >= c.conversions):
                logger.warning(f"Campaign {c.id} violates cascade: Sent: {c.messages_sent}, Del: {c.messages_delivered}, Opn: {c.messages_opened}, Clk: {c.messages_clicked}, Conv: {c.conversions}")
                
            open_rate = (c.messages_opened / c.messages_delivered * 100) if c.messages_delivered > 0 else 0
            if open_rate > 100:
                logger.warning(f"Campaign {c.id} has open_rate > 100%: {open_rate}%")
                
            ctr = (c.messages_clicked / c.messages_delivered * 100) if c.messages_delivered > 0 else 0
            if ctr > 100:
                logger.warning(f"Campaign {c.id} has ctr > 100%: {ctr}%")

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        AnalyticsValidator.validate()
        print("Validation complete.")

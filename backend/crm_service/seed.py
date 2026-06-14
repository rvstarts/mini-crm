import os
import random
from datetime import datetime, timedelta
from faker import Faker
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.models import db, Customer, Order, Segment, Campaign, CustomerAiAnalysis, Template, CommunicationLog, Journey, JourneyState

fake = Faker()

def seed_database():
    app = create_app()
    with app.app_context():
        print("Creating tables...")
        db.create_all()

        print("Clearing existing data...")
        CommunicationLog.query.delete()
        JourneyState.query.delete()
        Journey.query.delete()
        Order.query.delete()
        Campaign.query.delete()
        CustomerAiAnalysis.query.delete()
        Segment.query.delete()
        Template.query.delete()
        Customer.query.delete()
        db.session.commit()

        print("Seeding templates...")
        templates = [
            Template(
                name="Monthly Newsletter",
                category="Newsletter",
                subject_line="Your Monthly Update is Here!",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:20px;'><h1 style='color:#3b82f6;'>Monthly Newsletter</h1><p>Hi {{name}},</p><p>Check out our latest updates and news for this month. We have exciting things to share with you!</p><a href='#' style='display:inline-block;padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:5px;'>Read More</a></div>",
                json_content=[], times_used=42
            ),
            Template(
                name="We Miss You (Win Back)",
                category="Win Back",
                subject_line="We miss you! Here is 20% off.",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:20px;'><h1 style='color:#ef4444;'>We miss you, {{name}}!</h1><p>It has been a while since your last visit. Come back and use code <b>MISSYOU20</b> for 20% off your next order.</p><a href='#' style='display:inline-block;padding:10px 20px;background:#ef4444;color:white;text-decoration:none;border-radius:5px;'>Claim Discount</a></div>",
                json_content=[], times_used=18
            ),
            Template(
                name="Flash Sale Promo",
                category="Promotional",
                subject_line="⚡ Flash Sale: 50% OFF Everything!",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;text-align:center;padding:40px;background:#fef3c7;'><h1 style='color:#d97706;font-size:36px;'>FLASH SALE</h1><p style='font-size:18px;'>Get 50% off sitewide for the next 24 hours only. Don't miss out!</p><br><a href='#' style='display:inline-block;padding:15px 30px;background:#d97706;color:white;text-decoration:none;font-weight:bold;border-radius:50px;'>SHOP NOW</a></div>",
                json_content=[], times_used=105
            ),
            Template(
                name="Exclusive VIP Invite",
                category="VIP",
                subject_line="Exclusive: Your VIP Access",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:30px;background:#1e1e1e;color:#fff;'><h1 style='color:#fbbf24;text-align:center;'>VIP EXCLUSIVE</h1><p>Dear {{name}}, as one of our top customers, you've unlocked early access to our new collection.</p><div style='text-align:center;margin-top:30px;'><a href='#' style='padding:12px 25px;background:#fbbf24;color:#1e1e1e;text-decoration:none;font-weight:bold;border-radius:3px;'>ENTER VIP LOUNGE</a></div></div>",
                json_content=[], times_used=12
            ),
            Template(
                name="Abandoned Cart Reminder",
                category="Cart Recovery",
                subject_line="Did you forget something?",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:20px;'><h2 style='color:#4b5563;'>You left items in your cart</h2><p>Hi {{name}}, you have great taste! The items in your cart are selling out fast. Complete your purchase now before they are gone.</p><a href='#' style='display:inline-block;padding:10px 20px;background:#10b981;color:white;text-decoration:none;border-radius:5px;'>Complete Purchase</a></div>",
                json_content=[], times_used=230
            ),
            Template(
                name="You Might Also Like",
                category="Cross Sell",
                subject_line="Pairs perfectly with your recent purchase",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:20px;'><h2>Upgrade your experience</h2><p>Since you bought a recent item, we thought you might love these hand-picked recommendations.</p><ul><li>Premium Accessory - $29</li><li>Extended Warranty - $19</li></ul><a href='#' style='display:inline-block;padding:10px 20px;background:#8b5cf6;color:white;text-decoration:none;border-radius:5px;'>View Recommendations</a></div>",
                json_content=[], times_used=45
            ),
            Template(
                name="New Product Drop",
                category="Product Launch",
                subject_line="Introducing our newest product!",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:20px;text-align:center;'><img src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' style='width:100%;border-radius:10px;'/><h2>Meet the Future</h2><p>Our completely redesigned product line is finally here. Order yours today.</p></div>",
                json_content=[], times_used=8
            ),
            Template(
                name="Holiday Special",
                category="Seasonal",
                subject_line="Happy Holidays from our team",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:30px;background:#dc2626;color:white;text-align:center;'><h1>Happy Holidays!</h1><p>Wishing you and your family the best this season. Enjoy free shipping on all orders this week.</p></div>",
                json_content=[], times_used=3
            ),
            Template(
                name="Happy Birthday!",
                category="Birthday",
                subject_line="A special gift for your birthday \U0001F382",
                html_content="<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:30px;text-align:center;'><h1 style='font-size:40px;'>\U0001F389</h1><h2>Happy Birthday, {{name}}!</h2><p>We want to celebrate you! Here is a $15 gift card to use on your special day.</p><a href='#' style='display:inline-block;padding:10px 20px;background:#ec4899;color:white;text-decoration:none;border-radius:5px;'>Claim Gift</a></div>",
                json_content=[], times_used=89
            )
        ]
        db.session.add_all(templates)
        db.session.commit()

        print("Seeding customers and orders...")
        customers = []
        for _ in range(50):
            c = Customer(
                name=fake.name(),
                email=fake.unique.email(),
                phone=fake.phone_number(),
                city=fake.city(),
                created_at=fake.date_time_between(start_date='-2y', end_date='now'),
                last_active=fake.date_time_between(start_date='-6m', end_date='now'),
                churn_risk_score=random.uniform(0.1, 0.9),
                churn_risk_category=random.choice(["Low", "Medium", "High"]),
                predicted_ltv=random.uniform(100.0, 5000.0)
            )
            customers.append(c)
            db.session.add(c)
        db.session.commit()

        print("Adding orders for customers...")
        categories = ["Electronics", "Apparel", "Home", "Beauty", "Sports"]
        channels = ["Web", "Mobile App", "In-store"]
        for c in customers:
            num_orders = random.randint(1, 10)
            total_spent = 0
            for _ in range(num_orders):
                amount = round(random.uniform(10.0, 500.0), 2)
                total_spent += amount
                o = Order(
                    customer_id=c.id,
                    amount=amount,
                    category=random.choice(categories),
                    channel=random.choice(channels),
                    status=random.choice(["completed", "completed", "completed", "pending", "refunded"]),
                    created_at=fake.date_time_between(start_date=c.created_at, end_date='now')
                )
                db.session.add(o)
            
            c.order_count = num_orders
            c.total_spend = total_spent
            c.avg_order_value = total_spent / num_orders if num_orders > 0 else 0

            # Add AI Analysis
            analysis = CustomerAiAnalysis(
                customer_id=c.id,
                predicted_ltv=c.predicted_ltv,
                risk_score=int(c.churn_risk_score * 100),
                risk_level=c.churn_risk_category,
                reason="Based on recent inactivity and purchase patterns.",
                recommended_action="Send a personalized discount offer.",
                best_channel="Email",
                confidence=random.randint(70, 99),
                model_used="TARS Predictor V1"
            )
            db.session.add(analysis)

        db.session.commit()

        print("Seeding segments...")
        s1 = Segment(
            name="High Value Customers",
            description="Customers with LTV > $1000",
            rules_json={"ltv": {"operator": ">", "value": 1000}},
            audience_count=15
        )
        s2 = Segment(
            name="Churn Risk (High)",
            description="Customers with high churn probability",
            rules_json={"churn_risk": {"operator": "==", "value": "High"}},
            audience_count=8
        )
        db.session.add_all([s1, s2])
        db.session.commit()

        print("Seeding campaigns...")
        c1 = Campaign(
            name="Summer Sale 2026",
            segment_id=s1.id,
            channel="Email",
            status="active",
            message="Hello VIP! Enjoy 30% off your next purchase.",
            messages_sent=15,
            messages_opened=10,
            messages_clicked=5
        )
        db.session.add(c1)
        db.session.commit()

        print("Database successfully seeded with dummy data!")

if __name__ == '__main__':
    seed_database()

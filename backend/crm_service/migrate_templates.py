import sqlite3
import os
import json
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.models import db, Template

def migrate():
    # Path to old SQLite database
    sqlite_db_path = os.path.join(os.path.dirname(__file__), 'instance', 'crm.db')
    
    if not os.path.exists(sqlite_db_path):
        print(f"Error: SQLite database not found at {sqlite_db_path}")
        return

    # Connect to SQLite
    conn = sqlite3.connect(sqlite_db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM templates")
    sqlite_templates = cursor.fetchall()

    app = create_app()
    with app.app_context():
        print(f"Found {len(sqlite_templates)} templates in old SQLite database.")
        
        # Clear dummy templates we just seeded
        Template.query.delete()
        db.session.commit()

        # Migrate each template
        migrated_count = 0
        for row in sqlite_templates:
            # Parse JSON fields safely
            try:
                json_content = json.loads(row['json_content']) if row['json_content'] else []
            except:
                json_content = []
                
            try:
                versions_json = json.loads(row['versions_json']) if row['versions_json'] else []
            except:
                versions_json = []

            t = Template(
                name=row['name'],
                category=row['category'],
                subject_line=row['subject_line'],
                preheader=row['preheader'],
                thumbnail=row['thumbnail'],  # This contains the image data/URL
                html_content=row['html_content'],
                json_content=json_content,
                versions_json=versions_json,
                times_used=row['times_used'] or 0,
                messages_sent=row['messages_sent'] or 0,
                messages_delivered=row['messages_delivered'] or 0,
                messages_opened=row['messages_opened'] or 0,
                messages_clicked=row['messages_clicked'] or 0,
                conversion_rate=row['conversion_rate'] or 0.0,
                revenue_generated=row['revenue_generated'] or 0.0,
                created_by=row['created_by']
                # Ignore id to let Postgres auto-increment, and timestamps will use defaults or can be preserved
            )
            db.session.add(t)
            migrated_count += 1
            
        db.session.commit()
        print(f"Successfully migrated {migrated_count} templates to PostgreSQL!")

    conn.close()

if __name__ == '__main__':
    migrate()

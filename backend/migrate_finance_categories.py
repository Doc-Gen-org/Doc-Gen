"""
One-time migration: adds categories to the Finance page.
"""

import sys
import os
import sqlite3

sys.path.insert(0, os.path.dirname(__file__))

from services.app_paths import DB_PATH
from models.database import SessionLocal, engine, Base
from models.schemas import FinanceCategory, FinanceRecord


def ensure_category_id_column():
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.execute("PRAGMA table_info(finance_records)")
        columns = [row[1] for row in cursor.fetchall()]

        if not columns:
            return

        if "category_id" not in columns:
            conn.execute("ALTER TABLE finance_records ADD COLUMN category_id INTEGER")
            conn.commit()
            print("Added category_id column to finance_records.")
        else:
            print("category_id column already present — nothing to add.")
    finally:
        conn.close()


def run():
    ensure_category_id_column()

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        uncategorized = db.query(FinanceRecord).filter(FinanceRecord.category_id.is_(None)).all()

        if not uncategorized:
            print("Nothing to migrate — every finance record already has a category.")
            return

        general = db.query(FinanceCategory).filter(FinanceCategory.name == "General").first()
        if not general:
            general = FinanceCategory(name="General")
            db.add(general)
            db.commit()
            db.refresh(general)
            print(f"Created 'General' category (id={general.id}).")

        for record in uncategorized:
            record.category_id = general.id
        db.commit()

        print(f"Moved {len(uncategorized)} existing record(s) into 'General'.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
"""
One-time migration: converts the old company/trainer-shaped finance_records
table into the new generic received/paid entry shape.

Run this ONCE, from the backend/ folder, with the backend server STOPPED:
    python migrate_finance_generic.py

Safe to run even if the table is already in the new shape (it detects this
and does nothing). Existing data is preserved: each old row becomes TWO new
rows — one "received" entry (using the old company name as the note) and
one "paid" entry (using the old trainer name as the note) — since the old
schema tracked both sides of one engagement in a single row, and the new
schema tracks each side as its own entry.
"""

import sqlite3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from services.app_paths import DB_PATH


def main():
    if not os.path.exists(DB_PATH):
        print("No docgen.db found — nothing to migrate (fresh install).")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='finance_records'")
    if not cur.fetchone():
        print("No finance_records table found — nothing to migrate.")
        conn.close()
        return

    cur.execute("PRAGMA table_info(finance_records)")
    columns = {row[1] for row in cur.fetchall()}

    if "entry_type" in columns:
        print("finance_records is already in the new generic shape — nothing to do.")
        conn.close()
        return

    if "company_name" not in columns:
        print("finance_records is in an unrecognized shape — not touching it. Check manually.")
        conn.close()
        return

    cur.execute("""
        SELECT id, company_name, amount_received, receiving_date,
               trainer_name, amount_sent, sending_date, notes, created_at
        FROM finance_records
    """)
    old_rows = cur.fetchall()
    print(f"Found {len(old_rows)} existing record(s) to migrate.")

    cur.execute("ALTER TABLE finance_records RENAME TO finance_records_old")

    cur.execute("""
        CREATE TABLE finance_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_type VARCHAR NOT NULL,
            amount FLOAT NOT NULL,
            date VARCHAR NOT NULL,
            notes VARCHAR,
            created_at DATETIME
        )
    """)

    migrated = 0
    for (_id, company_name, amount_received, receiving_date,
         trainer_name, amount_sent, sending_date, notes, created_at) in old_rows:

        extra_note = f" — {notes}" if notes else ""

        cur.execute(
            "INSERT INTO finance_records (entry_type, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?)",
            ("received", amount_received, receiving_date, f"{company_name}{extra_note}", created_at),
        )
        cur.execute(
            "INSERT INTO finance_records (entry_type, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?)",
            ("paid", amount_sent, sending_date, f"{trainer_name}{extra_note}", created_at),
        )
        migrated += 2

    cur.execute("DROP TABLE finance_records_old")
    conn.commit()
    conn.close()

    print(f"Done. {len(old_rows)} old record(s) -> {migrated} new record(s) (2 per old row).")


if __name__ == "__main__":
    main()
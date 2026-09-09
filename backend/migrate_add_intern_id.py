"""
One-time migration: adds the intern_id column to the existing documents
table (needed for the new Internship Offer Letter feature).

Run this ONCE, from the backend/ folder, with the backend server STOPPED:
    python migrate_add_intern_id.py

Safe to run multiple times — checks if the column already exists first.
The new interns / intern_counter tables don't need this script; those are
brand-new tables and get created automatically by create_all() on startup.
"""

import sqlite3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from services.app_paths import DB_PATH


def main():
    if not os.path.exists(DB_PATH):
        print("No docgen.db found — nothing to migrate (fresh install, table will be created correctly on first run).")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='documents'")
    if not cur.fetchone():
        print("No documents table found — nothing to migrate.")
        conn.close()
        return

    cur.execute("PRAGMA table_info(documents)")
    columns = {row[1] for row in cur.fetchall()}

    if "intern_id" in columns:
        print("documents.intern_id already exists — nothing to do.")
        conn.close()
        return

    cur.execute("ALTER TABLE documents ADD COLUMN intern_id INTEGER")
    conn.commit()
    conn.close()
    print("Done — added intern_id column to documents.")


if __name__ == "__main__":
    main()
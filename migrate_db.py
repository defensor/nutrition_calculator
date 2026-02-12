import sqlite3
import os

DB_FILE = 'backend/sql_app.db'

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(log_entries)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'is_cooked_weight_auto' not in columns:
            print("Adding is_cooked_weight_auto column...")
            cursor.execute("ALTER TABLE log_entries ADD COLUMN is_cooked_weight_auto BOOLEAN DEFAULT 1")
        else:
            print("Column is_cooked_weight_auto already exists.")

        if 'is_consumed_weight_auto' not in columns:
            print("Adding is_consumed_weight_auto column...")
            cursor.execute("ALTER TABLE log_entries ADD COLUMN is_consumed_weight_auto BOOLEAN DEFAULT 1")
        else:
            print("Column is_consumed_weight_auto already exists.")

        conn.commit()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

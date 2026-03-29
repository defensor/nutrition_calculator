import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sql_app.db")

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. No migration needed.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if fiber column exists
        cursor.execute("PRAGMA table_info(products)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'fiber' not in columns:
            print("Adding 'fiber' column to 'products' table...")
            cursor.execute("ALTER TABLE products ADD COLUMN fiber FLOAT DEFAULT 0.0")
            conn.commit()
            print("Migration successful.")
        else:
            print("'fiber' column already exists in 'products' table.")

    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

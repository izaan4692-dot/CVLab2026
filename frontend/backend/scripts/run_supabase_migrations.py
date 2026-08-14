"""
Run Supabase Migrations Script
Executes SQL migrations against Supabase database
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
MIGRATIONS_DIR = Path(__file__).parent.parent / "supabase" / "migrations"


def run_migrations():
    """Run all SQL migrations in order"""

    if not DATABASE_URL:
        print("[ERROR] DATABASE_URL not configured!")
        return False

    print("=" * 60)
    print("Running Supabase Migrations")
    print("=" * 60)

    # Get all migration files sorted by name
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

    if not migration_files:
        print("[INFO] No migration files found")
        return True

    print(f"[INFO] Found {len(migration_files)} migration(s)")

    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        # Create migrations tracking table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)

        # Get already executed migrations
        cursor.execute("SELECT name FROM _migrations")
        executed = {row[0] for row in cursor.fetchall()}

        # Run pending migrations
        for migration_file in migration_files:
            migration_name = migration_file.name

            if migration_name in executed:
                print(f"[SKIP] {migration_name} (already executed)")
                continue

            print(f"[RUN]  {migration_name}")

            # Read and execute migration
            migration_sql = migration_file.read_text(encoding="utf-8")

            try:
                cursor.execute(migration_sql)

                # Record migration
                cursor.execute(
                    "INSERT INTO _migrations (name) VALUES (%s)",
                    (migration_name,)
                )

                print(f"[OK]   {migration_name}")

            except Exception as e:
                print(f"[FAIL] {migration_name}: {e}")
                return False

        cursor.close()
        conn.close()

        print()
        print("[OK] All migrations completed successfully!")
        return True

    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        return False


if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)

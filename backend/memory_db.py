import sqlite3
from pathlib import Path
from datetime import datetime


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "india_companion.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_database():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS traveller_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            nationality TEXT,
            food_preference TEXT,
            spice_preference TEXT,
            budget TEXT,
            interests TEXT,
            travel_style TEXT,
            current_city TEXT,
            updated_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS travel_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memory_type TEXT NOT NULL,
            memory TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS travel_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT,
            location TEXT,
            description TEXT,
            created_at TEXT
        )
    """)

    connection.commit()
    connection.close()


def get_profile():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM traveller_profile
        ORDER BY id DESC
        LIMIT 1
    """)

    row = cursor.fetchone()

    connection.close()

    if row is None:
        return None

    return dict(row)


def save_profile(
    name=None,
    nationality=None,
    food_preference=None,
    spice_preference=None,
    budget=None,
    interests=None,
    travel_style=None,
    current_city=None
):
    connection = get_connection()

    cursor = connection.cursor()

    existing = get_profile()

    now = datetime.now().isoformat()

    if existing:

        cursor.execute("""
            UPDATE traveller_profile
            SET
                name = COALESCE(?, name),
                nationality = COALESCE(?, nationality),
                food_preference = COALESCE(?, food_preference),
                spice_preference = COALESCE(?, spice_preference),
                budget = COALESCE(?, budget),
                interests = COALESCE(?, interests),
                travel_style = COALESCE(?, travel_style),
                current_city = COALESCE(?, current_city),
                updated_at = ?
            WHERE id = ?
        """, (
            name,
            nationality,
            food_preference,
            spice_preference,
            budget,
            interests,
            travel_style,
            current_city,
            now,
            existing["id"]
        ))

    else:

        cursor.execute("""
            INSERT INTO traveller_profile (
                name,
                nationality,
                food_preference,
                spice_preference,
                budget,
                interests,
                travel_style,
                current_city,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            name,
            nationality,
            food_preference,
            spice_preference,
            budget,
            interests,
            travel_style,
            current_city,
            now
        ))

    connection.commit()
    connection.close()

    return get_profile()


def add_memory(memory_type, memory):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO travel_memory (
            memory_type,
            memory,
            created_at
        )
        VALUES (?, ?, ?)
    """, (
        memory_type,
        memory,
        datetime.now().isoformat()
    ))

    connection.commit()
    connection.close()


def get_memories(limit=20):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM travel_memory
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]


def add_travel_event(
    event_type,
    location,
    description
):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO travel_events (
            event_type,
            location,
            description,
            created_at
        )
        VALUES (?, ?, ?, ?)
    """, (
        event_type,
        location,
        description,
        datetime.now().isoformat()
    ))

    connection.commit()
    connection.close()


def get_travel_events(limit=20):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM travel_events
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]
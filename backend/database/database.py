import sqlite3
from pathlib import Path


# Get backend folder path
BASE_DIR = Path(__file__).resolve().parent.parent

# Database file path
DB_PATH = BASE_DIR / "stream_anomaly.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


def create_table():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stream_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            cpu REAL,
            ram REAL,
            network REAL,
            predicted_cpu REAL,
            anomaly INTEGER,
            anomaly_score REAL
        )
    """)

    connection.commit()
    connection.close()


def save_record(data):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO stream_records (
            timestamp,
            cpu,
            ram,
            network,
            predicted_cpu,
            anomaly,
            anomaly_score
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data["timestamp"],
        data["cpu"],
        data["ram"],
        data["network"],
        data["predicted_cpu"],
        int(data["anomaly"]),
        data["anomaly_score"]
    ))

    connection.commit()
    connection.close()
import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).with_name("recruiter_bot.db")
SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def get_connection(database_path=None):
    """Open a connection configured for this application."""
    if database_path is None:
        database_path = DATABASE_PATH
    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db(database_path=None):
    """Create the database tables when they do not already exist."""
    if database_path is None:
        database_path = DATABASE_PATH
    connection = get_connection(database_path)
    try:
        connection.executescript(SCHEMA_PATH.read_text())
        connection.commit()
    finally:
        connection.close()

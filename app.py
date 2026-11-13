
from flask import Flask, render_template, jsonify, request
import sqlite3
from datetime import datetime, timezone

app = Flask(__name__)

DATABASE = "typing.db"


def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wpm INTEGER NOT NULL,
                accuracy INTEGER NOT NULL,
                errors INTEGER NOT NULL,
                duration INTEGER NOT NULL,
                characters INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
        """)


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/practice")
def practice():
    return render_template("practice.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/api/results", methods=["POST"])
def save_result():
    data = request.get_json(silent=True) or {}

    try:
        wpm = int(data["wpm"])
        accuracy = int(data["accuracy"])
        errors = int(data["errors"])
        duration = int(data["duration"])
        characters = int(data["characters"])

        if not 0 <= wpm <= 1000:
            raise ValueError()

        if not 0 <= accuracy <= 100:
            raise ValueError()

        if not 0 <= errors <= 100000:
            raise ValueError()

        if duration not in (15, 30, 60, 120):
            raise ValueError()

        if not 0 <= characters <= 100000:
            raise ValueError()

    except (KeyError, TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Invalid test results"
        }), 400

    with get_db() as conn:
        conn.execute("""
            INSERT INTO results
            (wpm, accuracy, errors, duration, characters, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            wpm,
            accuracy,
            errors,
            duration,
            characters,
            datetime.now(timezone.utc).isoformat()
        ))

    return jsonify({"status": "saved"}), 201


@app.route("/api/history")
def history():
    with get_db() as conn:
        rows = conn.execute("""
            SELECT * FROM results
            ORDER BY id DESC
            LIMIT 50
        """).fetchall()

    return jsonify([dict(row) for row in rows])


@app.route("/api/dashboard")
def dashboard_data():
    with get_db() as conn:

        stats = conn.execute("""
            SELECT
                COUNT(*) AS total_tests,
                COALESCE(ROUND(AVG(wpm)), 0) AS average_wpm,
                COALESCE(MAX(wpm), 0) AS best_wpm,
                COALESCE(ROUND(AVG(accuracy)), 0) AS average_accuracy,
                COALESCE(SUM(errors), 0) AS total_errors
            FROM results
        """).fetchone()

        recent = conn.execute("""
            SELECT *
            FROM results
            ORDER BY id DESC
            LIMIT 10
        """).fetchall()

        chart = conn.execute("""
            SELECT id, wpm, accuracy, created_at
            FROM results
            ORDER BY id DESC
            LIMIT 20
        """).fetchall()

    return jsonify({
        "stats": dict(stats),
        "recent": [dict(row) for row in recent],
        "chart": [dict(row) for row in reversed(chart)]
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "online",
        "app": "Tik Tik"
    })


init_db()


if __name__ == "__main__":
    app.run(debug=True)

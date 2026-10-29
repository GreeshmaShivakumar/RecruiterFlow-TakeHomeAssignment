import sqlite3

from flask import Flask, jsonify, request

from db import get_connection, init_db
from seed import replace_data


app = Flask(__name__)


@app.get("/jobs")
def list_jobs():
    connection = get_connection()
    try:
        rows = connection.execute(
            "SELECT id, title, min_experience, tagline FROM jobs ORDER BY id"
        ).fetchall()
        return jsonify([dict(row) for row in rows])
    finally:
        connection.close()


@app.get("/candidates")
def list_candidates():
    connection = get_connection()
    try:
        rows = connection.execute(
            """
            SELECT id, name, experience_years, availability, quirk
            FROM candidates
            ORDER BY id
            """
        ).fetchall()
        return jsonify([dict(row) for row in rows])
    finally:
        connection.close()


@app.get("/jobs/<int:job_id>/matches")
def get_job_matches(job_id):
    connection = get_connection()
    try:
        job = connection.execute(
            "SELECT id FROM jobs WHERE id = ?", (job_id,)
        ).fetchone()
        if job is None:
            return jsonify({"error": "Job not found"}), 404

        rows = connection.execute(
            """
            SELECT candidates.id, candidates.name, matches.score,
                   matches.skill_score, matches.experience_score,
                   matches.culture_score, matches.availability_score,
                   matches.reason, candidates.experience_years
            FROM matches
            JOIN candidates ON candidates.id = matches.candidate_id
            WHERE matches.job_id = ?
            ORDER BY matches.score DESC,
                     matches.skill_score DESC,
                     candidates.experience_years DESC,
                     candidates.name ASC
            """,
            (job_id,),
        ).fetchall()
        return jsonify([match_response(row) for row in rows])
    finally:
        connection.close()


@app.get("/candidates/<int:candidate_id>/matches")
def get_candidate_matches(candidate_id):
    connection = get_connection()
    try:
        candidate = connection.execute(
            "SELECT id FROM candidates WHERE id = ?", (candidate_id,)
        ).fetchone()
        if candidate is None:
            return jsonify({"error": "Candidate not found"}), 404

        rows = connection.execute(
            """
            SELECT jobs.id, jobs.title, matches.score,
                   matches.skill_score, matches.experience_score,
                   matches.culture_score, matches.availability_score,
                   matches.reason
            FROM matches
            JOIN jobs ON jobs.id = matches.job_id
            WHERE matches.candidate_id = ?
            ORDER BY matches.score DESC, matches.skill_score DESC, jobs.title ASC
            """,
            (candidate_id,),
        ).fetchall()
        return jsonify([job_match_response(row) for row in rows])
    finally:
        connection.close()


@app.post("/ingest")
def ingest():
    payload = request.get_json(silent=True)
    error = validate_payload(payload)
    if error:
        return jsonify({"error": error}), 400

    connection = get_connection()
    try:
        replace_data(connection, payload["candidates"], payload["jobs"])
        connection.commit()
        return jsonify({"message": "Data ingested and matches recomputed."}), 201
    except (KeyError, TypeError, ValueError, sqlite3.IntegrityError) as error:
        connection.rollback()
        return jsonify({"error": str(error)}), 400
    finally:
        connection.close()


def validate_payload(payload):
    if not isinstance(payload, dict):
        return "Request body must be a JSON object."
    if not isinstance(payload.get("candidates"), list):
        return "candidates must be a list."
    if not isinstance(payload.get("jobs"), list):
        return "jobs must be a list."

    candidate_fields = {
        "id", "name", "skills", "experience_years", "availability", "traits", "quirk"
    }
    job_fields = {"id", "title", "skills", "min_experience", "culture_keywords", "tagline"}
    for candidate in payload["candidates"]:
        if not isinstance(candidate, dict) or not candidate_fields <= candidate.keys():
            return "Each candidate must include all required fields."
        if not valid_candidate(candidate):
            return "Each candidate must have valid field values."
    for job in payload["jobs"]:
        if not isinstance(job, dict) or not job_fields <= job.keys():
            return "Each job must include all required fields."
        if not valid_job(job):
            return "Each job must have valid field values."
    return None


def valid_string_list(value):
    return (
        isinstance(value, list)
        and all(isinstance(item, str) and item.strip() for item in value)
        and len(set(value)) == len(value)
    )


def valid_candidate(candidate):
    return (
        isinstance(candidate["id"], int)
        and not isinstance(candidate["id"], bool)
        and candidate["id"] > 0
        and isinstance(candidate["name"], str)
        and bool(candidate["name"].strip())
        and valid_string_list(candidate["skills"])
        and isinstance(candidate["experience_years"], int)
        and not isinstance(candidate["experience_years"], bool)
        and candidate["experience_years"] >= 0
        and candidate["availability"] in {"immediate", "2_weeks", "not_looking"}
        and valid_string_list(candidate["traits"])
        and isinstance(candidate["quirk"], str)
        and bool(candidate["quirk"].strip())
    )


def valid_job(job):
    return (
        isinstance(job["id"], int)
        and not isinstance(job["id"], bool)
        and job["id"] > 0
        and isinstance(job["title"], str)
        and bool(job["title"].strip())
        and valid_string_list(job["skills"])
        and isinstance(job["min_experience"], int)
        and not isinstance(job["min_experience"], bool)
        and job["min_experience"] >= 0
        and valid_string_list(job["culture_keywords"])
        and isinstance(job["tagline"], str)
        and bool(job["tagline"].strip())
    )


def match_response(row):
    return {
        "candidate_id": row["id"],
        "name": row["name"],
        "score": row["score"],
        "skill_score": row["skill_score"],
        "experience_score": row["experience_score"],
        "culture_score": row["culture_score"],
        "availability_score": row["availability_score"],
        "reason": row["reason"],
    }


def job_match_response(row):
    return {
        "job_id": row["id"],
        "title": row["title"],
        "score": row["score"],
        "skill_score": row["skill_score"],
        "experience_score": row["experience_score"],
        "culture_score": row["culture_score"],
        "availability_score": row["availability_score"],
        "reason": row["reason"],
    }


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
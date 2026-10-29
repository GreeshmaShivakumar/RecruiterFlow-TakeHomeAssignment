from db import get_connection, init_db


CANDIDATES = [
    {
        "id": 1,
        "name": "Sherlock H.",
        "skills": ["deduction", "pattern-recognition", "forensics"],
        "experience_years": 8,
        "availability": "immediate",
        "traits": ["analytical", "blunt"],
        "quirk": "Solves problems by eliminating the impossible; occasionally insufferable in standups.",
    },
    {
        "id": 2,
        "name": "Hermione G.",
        "skills": ["research", "time-management", "public-speaking"],
        "experience_years": 4,
        "availability": "2_weeks",
        "traits": ["detail-oriented", "overachiever"],
        "quirk": "Reads the entire documentation before writing a single line of code.",
    },
    {
        "id": 3,
        "name": "Tony S.",
        "skills": ["systems-design", "rapid-prototyping", "leadership"],
        "experience_years": 12,
        "availability": "not_looking",
        "traits": ["confident", "innovative"],
        "quirk": "Ships an MVP overnight, refuses to write tests.",
    },
    {
        "id": 4,
        "name": "Leslie K.",
        "skills": ["project-management", "stakeholder-management", "public-speaking"],
        "experience_years": 6,
        "availability": "immediate",
        "traits": ["tenacious", "organized"],
        "quirk": "Has a binder for everything, including the binder.",
    },
    {
        "id": 5,
        "name": "Ron S.",
        "skills": ["woodworking", "minimalism", "negotiation"],
        "experience_years": 15,
        "availability": "not_looking",
        "traits": ["stubborn", "principled"],
        "quirk": "Refuses to use more than one monitor.",
    },
    {
        "id": 6,
        "name": "Rick S.",
        "skills": ["systems-design", "rapid-prototyping", "chemistry"],
        "experience_years": 20,
        "availability": "immediate",
        "traits": ["genius", "reckless"],
        "quirk": "Solution works, mechanism deeply concerning.",
    },
    {
        "id": 7,
        "name": "Elle W.",
        "skills": ["persuasion", "research", "public-speaking"],
        "experience_years": 3,
        "availability": "immediate",
        "traits": ["optimistic", "sharp"],
        "quirk": "Underestimated in every standup, correct in every retro.",
    },
    {
        "id": 8,
        "name": "MacGyver",
        "skills": ["rapid-prototyping", "resourcefulness", "chemistry", "systems-design"],
        "experience_years": 10,
        "availability": "2_weeks",
        "traits": ["calm", "improviser"],
        "quirk": "Fixes production outages with duct tape and a paperclip metaphor.",
    },
    {
        "id": 9,
        "name": "Sheldon C.",
        "skills": ["theoretical-analysis", "pattern-recognition", "research"],
        "experience_years": 9,
        "availability": "immediate",
        "traits": ["rigid", "brilliant"],
        "quirk": "Correct 95% of the time, insufferable 100% of the time.",
    },
    {
        "id": 10,
        "name": "Katniss E.",
        "skills": ["precision", "strategy", "crisis-management"],
        "experience_years": 5,
        "availability": "immediate",
        "traits": ["resilient", "decisive"],
        "quirk": "Excellent under pressure, terrible with public speaking.",
    },
    {
        "id": 11,
        "name": "Michael S.",
        "skills": ["sales", "public-speaking", "team-building"],
        "experience_years": 11,
        "availability": "not_looking",
        "traits": ["enthusiastic", "chaotic"],
        "quirk": "World's best boss, according to a mug he bought himself.",
    },
    {
        "id": 12,
        "name": "Olivia P.",
        "skills": ["crisis-management", "negotiation", "strategy", "leadership"],
        "experience_years": 13,
        "availability": "2_weeks",
        "traits": ["decisive", "intense"],
        "quirk": "Handles it. Whatever it is.",
    },
    {
        "id": 13,
        "name": "Ted L.",
        "skills": ["team-building", "optimism", "mentorship", "public-speaking"],
        "experience_years": 7,
        "availability": "immediate",
        "traits": ["empathetic", "persistent"],
        "quirk": "Turns every technical setback into a folksy metaphor.",
    },
    {
        "id": 14,
        "name": "Miranda P.",
        "skills": ["leadership", "negotiation", "stakeholder-management", "precision"],
        "experience_years": 18,
        "availability": "not_looking",
        "traits": ["demanding", "decisive"],
        "quirk": "Reviews every PR personally. Says nothing. Everyone panics.",
    },
    {
        "id": 15,
        "name": "Dwight S.",
        "skills": ["sales", "negotiation", "security", "loyalty"],
        "experience_years": 9,
        "availability": "immediate",
        "traits": ["intense", "loyal"],
        "quirk": "Assistant to the regional backend engineer.",
    },
]

JOBS = [
    {
        "id": 1,
        "title": "Backend Detective",
        "skills": ["deduction", "pattern-recognition", "forensics"],
        "min_experience": 3,
        "culture_keywords": ["analytical", "autonomous"],
        "tagline": "We have a bug. We have no leads. We have you.",
    },
    {
        "id": 2,
        "title": "Rapid Prototyping Engineer",
        "skills": ["rapid-prototyping", "systems-design"],
        "min_experience": 2,
        "culture_keywords": ["innovative", "fast-paced"],
        "tagline": "Ship first, document never (kidding - please document).",
    },
    {
        "id": 3,
        "title": "Developer Relations Lead",
        "skills": ["public-speaking", "research"],
        "min_experience": 2,
        "culture_keywords": ["energetic", "curious"],
        "tagline": "Explain complex things to confused humans, cheerfully.",
    },
    {
        "id": 4,
        "title": "Engineering Manager, Chaos Team",
        "skills": ["team-building", "stakeholder-management", "leadership"],
        "min_experience": 5,
        "culture_keywords": ["empathetic", "organized"],
        "tagline": "Herd cats. The cats are senior engineers.",
    },
    {
        "id": 5,
        "title": "Incident Commander",
        "skills": ["crisis-management", "strategy", "negotiation"],
        "min_experience": 4,
        "culture_keywords": ["decisive", "calm-under-pressure"],
        "tagline": "3am page. You're the one who picks up.",
    },
    {
        "id": 6,
        "title": "Sales Engineer",
        "skills": ["sales", "public-speaking", "negotiation"],
        "min_experience": 3,
        "culture_keywords": ["enthusiastic", "persistent"],
        "tagline": "Sell the vision, then go build it.",
    },
]


def insert_candidate(connection, candidate):
    connection.execute(
        """
        INSERT INTO candidates (id, name, experience_years, availability, quirk)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            candidate["id"],
            candidate["name"],
            candidate["experience_years"],
            candidate["availability"],
            candidate["quirk"],
        ),
    )

    for skill in candidate["skills"]:
        connection.execute("INSERT OR IGNORE INTO skills (name) VALUES (?)", (skill,))
        skill_id = connection.execute(
            "SELECT id FROM skills WHERE name = ?", (skill,)
        ).fetchone()[0]
        connection.execute(
            "INSERT INTO candidate_skills (candidate_id, skill_id) VALUES (?, ?)",
            (candidate["id"], skill_id),
        )

    for trait in candidate["traits"]:
        connection.execute(
            "INSERT INTO candidate_traits (candidate_id, trait) VALUES (?, ?)",
            (candidate["id"], trait),
        )


def insert_job(connection, job):
    connection.execute(
        """
        INSERT INTO jobs (id, title, min_experience, tagline)
        VALUES (?, ?, ?, ?)
        """,
        (job["id"], job["title"], job["min_experience"], job["tagline"]),
    )

    for skill in job["skills"]:
        connection.execute("INSERT OR IGNORE INTO skills (name) VALUES (?)", (skill,))
        skill_id = connection.execute(
            "SELECT id FROM skills WHERE name = ?", (skill,)
        ).fetchone()[0]
        connection.execute(
            "INSERT INTO job_skills (job_id, skill_id) VALUES (?, ?)",
            (job["id"], skill_id),
        )

    for keyword in job["culture_keywords"]:
        connection.execute(
            "INSERT INTO job_culture_keywords (job_id, keyword) VALUES (?, ?)",
            (job["id"], keyword),
        )


def clear_seed_data(connection):
    """Clear dependent rows first so the seed can be run repeatedly."""
    connection.execute("DELETE FROM matches")
    connection.execute("DELETE FROM candidate_skills")
    connection.execute("DELETE FROM job_skills")
    connection.execute("DELETE FROM candidate_traits")
    connection.execute("DELETE FROM job_culture_keywords")
    connection.execute("DELETE FROM candidates")
    connection.execute("DELETE FROM jobs")
    connection.execute("DELETE FROM skills")


def recompute_matches(connection):
    """Replace stored matches using the pure scoring function from matching.py."""
    from matching import compute_matches

    connection.execute("DELETE FROM matches")
    rows = connection.execute(
        """
        SELECT id, name, experience_years, availability
        FROM candidates
        ORDER BY id
        """
    ).fetchall()
    candidates_by_id = {row["id"]: dict(row) for row in rows}

    rows = connection.execute(
        "SELECT id, title, min_experience FROM jobs ORDER BY id"
    ).fetchall()
    jobs_by_id = {row["id"]: dict(row) for row in rows}

    for candidate_id, candidate in candidates_by_id.items():
        candidate["skills"] = get_related_values(
            connection,
            """
            SELECT skills.name
            FROM skills
            JOIN candidate_skills ON candidate_skills.skill_id = skills.id
            WHERE candidate_skills.candidate_id = ?
            """,
            candidate_id,
        )
        candidate["traits"] = get_related_values(
            connection,
            "SELECT trait FROM candidate_traits WHERE candidate_id = ?",
            candidate_id,
        )

    for job_id, job in jobs_by_id.items():
        job["skills"] = get_related_values(
            connection,
            """
            SELECT skills.name
            FROM skills
            JOIN job_skills ON job_skills.skill_id = skills.id
            WHERE job_skills.job_id = ?
            """,
            job_id,
        )
        job["culture_keywords"] = get_related_values(
            connection,
            "SELECT keyword FROM job_culture_keywords WHERE job_id = ?",
            job_id,
        )

    for job in jobs_by_id.values():
        for candidate in candidates_by_id.values():
            match = compute_matches(candidate, job)
            if match is None:
                continue
            connection.execute(
                """
                INSERT INTO matches (
                    job_id, candidate_id, score, skill_score, experience_score,
                    culture_score, availability_score, reason
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    job["id"],
                    candidate["id"],
                    match["score"],
                    match["skill_score"],
                    match["experience_score"],
                    match["culture_score"],
                    match["availability_score"],
                    match["reason"],
                ),
            )


def get_related_values(connection, query, parent_id):
    return [row[0] for row in connection.execute(query, (parent_id,)).fetchall()]


def seed_database():
    """Create a fresh copy of the supplied data and calculate its matches."""
    init_db()
    connection = get_connection()
    try:
        replace_data(connection, CANDIDATES, JOBS)
        connection.commit()
    finally:
        connection.close()


def replace_data(connection, candidates, jobs):
    """Replace all records and recalculate matches in one transaction."""
    clear_seed_data(connection)
    for candidate in candidates:
        insert_candidate(connection, candidate)
    for job in jobs:
        insert_job(connection, job)
    recompute_matches(connection)


if __name__ == "__main__":
    seed_database()
    print("Seed data loaded.")

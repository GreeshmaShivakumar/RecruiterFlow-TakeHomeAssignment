AVAILABILITY_SCORES = {
    "immediate": 1.0,
    "2_weeks": 0.7,
    "not_looking": 0.2,
}


def compute_matches(candidate, job):
    """Return one scored match, or None when no required skill overlaps."""
    required_skills = set(job["skills"])
    candidate_skills = set(candidate["skills"])
    matching_skills = sorted(required_skills & candidate_skills)

    # A candidate without a relevant skill should not appear in the results.
    if not matching_skills:
        return None

    skill_score = len(matching_skills) / len(required_skills)
    experience_score = calculate_experience_score(
        candidate["experience_years"], job["min_experience"]
    )

    culture_keywords = set(job.get("culture_keywords", []))
    candidate_traits = set(candidate.get("traits", []))
    matching_culture = sorted(culture_keywords & candidate_traits)
    culture_score = calculate_culture_score(matching_culture, culture_keywords)
    availability_score = AVAILABILITY_SCORES[candidate["availability"]]

    score = round(
        100
        * (
            0.55 * skill_score
            + 0.25 * experience_score
            + 0.10 * culture_score
            + 0.10 * availability_score
        ),
        1,
    )

    return {
        "score": score,
        "skill_score": skill_score,
        "experience_score": experience_score,
        "culture_score": culture_score,
        "availability_score": availability_score,
        "reason": build_reason(
            candidate,
            job,
            matching_skills,
            matching_culture,
        ),
    }


def calculate_experience_score(candidate_years, minimum_years):
    if candidate_years >= minimum_years:
        return 1.0
    if minimum_years == 0:
        return 1.0
    return candidate_years / minimum_years


def calculate_culture_score(matching_culture, culture_keywords):
    if not culture_keywords:
        return 0.0
    return len(matching_culture) / len(culture_keywords)


def build_reason(candidate, job, matching_skills, matching_culture):
    required_skill_count = len(job["skills"])
    candidate_years = candidate["experience_years"]
    minimum_years = job["min_experience"]
    skill_names = ", ".join(matching_skills)

    reason = (
        f"Has {len(matching_skills)}/{required_skill_count} required skills "
        f"({skill_names}); {candidate_years} yrs vs {minimum_years} required;"
    )

    if matching_culture:
        culture_names = ", ".join(matching_culture)
        reason += f" matches culture: {culture_names};"
    else:
        reason += " matches culture: none;"

    availability_text = {
        "immediate": "available immediately",
        "2_weeks": "available in 2 weeks",
        "not_looking": "not currently looking",
    }[candidate["availability"]]
    return f"{reason} {availability_text}."

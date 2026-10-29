PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
    availability TEXT NOT NULL CHECK (availability IN ('immediate', '2_weeks', 'not_looking')),
    quirk TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    min_experience INTEGER NOT NULL CHECK (min_experience >= 0),
    tagline TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS candidate_skills (
    candidate_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    PRIMARY KEY (candidate_id, skill_id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_skills (
    job_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidate_traits (
    candidate_id INTEGER NOT NULL,
    trait TEXT NOT NULL,
    PRIMARY KEY (candidate_id, trait),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_culture_keywords (
    job_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    PRIMARY KEY (job_id, keyword),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
    job_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
    skill_score REAL NOT NULL CHECK (skill_score >= 0 AND skill_score <= 1),
    experience_score REAL NOT NULL CHECK (experience_score >= 0 AND experience_score <= 1),
    culture_score REAL NOT NULL CHECK (culture_score >= 0 AND culture_score <= 1),
    availability_score REAL NOT NULL CHECK (availability_score >= 0 AND availability_score <= 1),
    reason TEXT NOT NULL,
    PRIMARY KEY (job_id, candidate_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_skill_id
    ON candidate_skills(skill_id);

CREATE INDEX IF NOT EXISTS idx_job_skills_skill_id
    ON job_skills(skill_id);

CREATE INDEX IF NOT EXISTS idx_candidate_traits_trait
    ON candidate_traits(trait);

CREATE INDEX IF NOT EXISTS idx_job_culture_keywords_keyword
    ON job_culture_keywords(keyword);

CREATE INDEX IF NOT EXISTS idx_matches_candidate_id
    ON matches(candidate_id);

CREATE INDEX IF NOT EXISTS idx_matches_job_score
    ON matches(job_id, score DESC);

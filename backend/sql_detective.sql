-- Q1
-- List every currently open job posting and its recruiter.
SELECT
    job_postings.id AS job_posting_id,
    job_postings.title,
    recruiters.name AS recruiter_name
FROM job_postings
JOIN recruiters ON recruiters.id = job_postings.recruiter_id
WHERE job_postings.status = 'open'
ORDER BY job_postings.id;

-- Explanation:
-- The INNER JOIN connects each job posting to its recruiter, and the WHERE
-- clause keeps only open postings. Closed and on_hold postings are excluded.
-- Expected rows:
-- 1 | Backend Engineer I | Priya Shah
-- 2 | Backend Engineer I | Daniel Ortiz
-- 4 | Backend Engineer II | Priya Shah
-- 5 | DevOps Engineer | Wei Zhang


-- Q2
-- For every job posting, count distinct applicants who reached the Final stage.
SELECT
    job_postings.id AS job_posting_id,
    job_postings.title,
    COUNT(DISTINCT interviews.applicant_id) AS final_applicant_count
FROM job_postings
LEFT JOIN interviews
    ON interviews.job_posting_id = job_postings.id
   AND interviews.stage = 'Final'
GROUP BY job_postings.id, job_postings.title
ORDER BY job_postings.id;

-- Explanation:
-- The LEFT JOIN keeps postings that have no Final interviews, so they receive
-- zero. COUNT(DISTINCT applicant_id) protects the result from repeated Final
-- rows for the same applicant; NULL outcomes and no_show rows still count as
-- reaching the Final stage because the question asks about stage, not outcome.
-- Expected rows:
-- 1 | Backend Engineer I | 2
-- 2 | Backend Engineer I | 2
-- 3 | Data Analyst | 1
-- 4 | Backend Engineer II | 2
-- 5 | DevOps Engineer | 0
-- 6 | Data Analyst | 0
-- 7 | Backend Engineer I | 2


-- Q3
-- Find people who effectively applied to more than one job posting.
-- LOWER(email) combines applicant rows whose email casing differs.
SELECT
    LOWER(applicants.email) AS normalized_email,
    MIN(applicants.full_name) AS person_name,
    COUNT(DISTINCT interviews.job_posting_id) AS job_posting_count
FROM applicants
JOIN interviews ON interviews.applicant_id = applicants.id
GROUP BY LOWER(applicants.email)
HAVING COUNT(DISTINCT interviews.job_posting_id) > 1
ORDER BY normalized_email;

-- Explanation:
-- Interviews identify the job postings connected to each applicant row, and
-- LOWER(email) treats differently cased versions of one email as one person.
-- DISTINCT job_posting_id removes repeated stages within one posting; rows with
-- NULL source do not matter, while applicants with no interviews are absent.
-- Expected rows:
-- ananya.rao@mail.com | Ananya Rao | 2
-- ben.turner@mail.com | Ben Turner | 2
-- elena.popescu@mail.com | Elena Popescu | 2


-- Q4
-- For recruiters with at least 3 Final interviews, calculate Final conversion.
WITH recruiter_final_counts AS (
    SELECT
        recruiters.id AS recruiter_id,
        recruiters.name AS recruiter_name,
        COUNT(interviews.id) AS total_final_interviews,
        SUM(CASE WHEN interviews.outcome = 'passed' THEN 1 ELSE 0 END)
            AS passed_final_interviews
    FROM recruiters
    JOIN job_postings ON job_postings.recruiter_id = recruiters.id
    JOIN interviews
        ON interviews.job_posting_id = job_postings.id
       AND interviews.stage = 'Final'
    GROUP BY recruiters.id, recruiters.name
)
SELECT
    recruiter_id,
    recruiter_name,
    passed_final_interviews,
    total_final_interviews,
    ROUND(
        CAST(passed_final_interviews AS REAL) / total_final_interviews,
        4
    ) AS final_conversion_rate
FROM recruiter_final_counts
WHERE total_final_interviews >= 3
ORDER BY recruiter_id;

-- Explanation:
-- The joins connect Final interviews to recruiters through job_postings, and
-- the CASE expression counts only passed outcomes. NULL outcomes and no_show
-- outcomes remain in the denominator but not the numerator; recruiters with
-- fewer than three Final interviews are filtered out before the result.
-- Expected rows:
-- 1 | Priya Shah | 3 | 4 | 0.75
-- 2 | Daniel Ortiz | 2 | 4 | 0.5


-- Q5
-- For each department, find the recruiter(s) with the most passed Final interviews.
WITH recruiter_passed_finals AS (
    SELECT
        job_postings.department,
        recruiters.id AS recruiter_id,
        recruiters.name AS recruiter_name,
        COUNT(
            CASE
                WHEN interviews.stage = 'Final'
                 AND interviews.outcome = 'passed'
                THEN interviews.id
            END
        ) AS passed_final_interviews
    FROM job_postings
    JOIN recruiters ON recruiters.id = job_postings.recruiter_id
    LEFT JOIN interviews ON interviews.job_posting_id = job_postings.id
    GROUP BY
        job_postings.department,
        recruiters.id,
        recruiters.name
), ranked_recruiters AS (
    SELECT
        department,
        recruiter_id,
        recruiter_name,
        passed_final_interviews,
        RANK() OVER (
            PARTITION BY department
            ORDER BY passed_final_interviews DESC
        ) AS department_rank
    FROM recruiter_passed_finals
)
SELECT
    department,
    recruiter_id,
    recruiter_name,
    passed_final_interviews
FROM ranked_recruiters
WHERE department_rank = 1
ORDER BY department, recruiter_id;

-- Explanation:
-- The LEFT JOIN keeps recruiters whose department has no passed Final
-- interviews, so a department can still produce a zero-count winner. RANK()
-- returns all tied winners rather than arbitrarily discarding a tie; pending,
-- failed, and no_show interviews do not count as passed Finals.
-- Expected rows:
-- Data | 3 | Fatima Al-Sayed | 1
-- Engineering | 1 | Priya Shah | 3
-- Infrastructure | 4 | Wei Zhang | 0

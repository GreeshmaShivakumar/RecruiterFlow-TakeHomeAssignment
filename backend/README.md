# Recruiter matching API

This project is a small Flask and SQLite service for matching candidates to
jobs. It exposes JSON endpoints for the supplied recruiter data, calculates
explainable match scores, and includes the SQL Detective solutions required by
the assignment. It has no frontend: use the API routes or a tool such as
`curl.exe` to inspect the results.

## Project Files

- `app.py`: Flask routes only.
- `db.py`: SQLite connection helper and schema initialization.
- `schema.sql`: normalized tables, foreign keys, checks, and indexes.
- `seed.py`: supplied seed data, normalized inserts, and match recomputation.
- `matching.py`: pure matching and scoring functions with no database access.
- `sql_detective.sql`: the five hand-written queries for the supplied hiring-ops schema.
- `check_sql_detective.py`: an optional local verification script for those queries.
- `requirements.txt`: Python dependency list.

## Setup and installation

Use Python 3.10 or newer. From this directory, install the only runtime
dependency, Flask. A virtual environment is optional.

### Windows PowerShell

```powershell
python -m pip install -r requirements.txt
python seed.py
python app.py
```

The API starts at `http://127.0.0.1:5000`. The seed command creates
`recruiter_bot.db`, loads the supplied candidates and jobs, and calculates the
stored matches. Run `python seed.py` again whenever you want to reset the
database to the supplied data.

### Other shells

```bash
python3 -m pip install -r requirements.txt
python3 seed.py
python3 app.py
```

If you prefer to use a virtual environment on Windows, create and activate it
before running the installation commands above:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

On macOS or Linux, create and activate it with:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Use the running API

After `python app.py` starts the service, do not open the root URL
`http://127.0.0.1:5000/` as a web page; this project serves JSON API routes.
Open a second VS Code terminal and call one of these endpoints:

```powershell
curl.exe http://127.0.0.1:5000/jobs
curl.exe http://127.0.0.1:5000/candidates
curl.exe http://127.0.0.1:5000/jobs/1/matches
```

On macOS or Linux, use `curl` instead of `curl.exe`:

```bash
curl http://127.0.0.1:5000/jobs
curl http://127.0.0.1:5000/candidates
curl http://127.0.0.1:5000/jobs/1/matches
```

The available routes are:

- `GET /jobs`
- `GET /candidates`
- `GET /jobs/<id>/matches`
- `GET /candidates/<id>/matches`
- `POST /ingest`

### SQL detective queries

`sql_detective.sql` contains one labeled query for each hiring-ops question. It
uses the supplied hiring-ops tables as-is; those tables are intentionally
separate from the application schema in `schema.sql`. To verify the queries
against the supplied fixture:

```powershell
python check_sql_detective.py
```

On macOS or Linux, use:

```bash
python3 check_sql_detective.py
```

### Design and trade-offs

- The application schema is normalized: candidates and jobs are stored in
  their own tables, while skills, candidate skills, job skills, traits, and
  culture keywords use relationship tables. This avoids duplicated skill text
  and makes skill-based queries/indexing straightforward.
- `matches` stores the computed score components and reason. Matches are
  recomputed after seeding or ingestion, so both ranked endpoints can use
  simple, fast SQL reads rather than duplicating scoring logic at request time.
  The trade-off is that changing scoring rules or source records requires a
  recomputation.
- SQLite keeps the take-home service self-contained and requires no external
  database. `sqlite3` is used directly with parameterized, hand-written SQL;
  no ORM or query builder is used. A production deployment could move the
  schema to PostgreSQL without changing the endpoint contract.
- Candidates with zero required-skill overlap are omitted. This prevents a
  high experience or availability score from making an unrelated candidate
  appear to be a useful match.

## Matching Rules

Each job-candidate pair receives:

- `skill_score`: matching required skills divided by required skills.
- `experience_score`: `1.0` when the candidate meets the minimum, otherwise candidate years divided by minimum years.
- `culture_score`: matching traits divided by culture keywords.
- `availability_score`: immediate `1.0`, 2 weeks `0.7`, not looking `0.2`.
- `score`: `100 * (0.55 * skill + 0.25 * experience + 0.10 * culture + 0.10 * availability)`, rounded to one decimal.

Candidates with no required-skill overlap are excluded. Results are ordered by score, skill score, experience years, and then name where applicable.

## API examples

The following examples assume the server is running and demonstrate the
response shape and ingestion request.

Example response:

```json
[
  {
    "candidate_id": 1,
    "name": "Sherlock H.",
    "score": 95.0,
    "skill_score": 1.0,
    "experience_score": 1.0,
    "culture_score": 0.5,
    "availability_score": 1.0,
    "reason": "Has 3/3 required skills (deduction, forensics, pattern-recognition); 8 yrs vs 3 required; matches culture: analytical; available immediately."
  }
]
```

### Get ranked jobs for a candidate

```powershell
curl.exe http://127.0.0.1:5000/candidates/1/matches
```

### Ingest candidates and jobs

`POST /ingest` replaces the current candidates and jobs, then recomputes all matches. Every candidate must include `id`, `name`, `skills`, `experience_years`, `availability`, `traits`, and `quirk`. Every job must include `id`, `title`, `skills`, `min_experience`, `culture_keywords`, and `tagline`.

```powershell
$body = @'
{
  "candidates": [
    {
      "id": 1,
      "name": "Ada L.",
      "skills": ["python", "systems-design"],
      "experience_years": 5,
      "availability": "immediate",
      "traits": ["analytical"],
      "quirk": "Writes elegant debugging notes."
    }
  ],
  "jobs": [
    {
      "id": 1,
      "title": "Backend Engineer",
      "skills": ["python", "systems-design"],
      "min_experience": 3,
      "culture_keywords": ["analytical"],
      "tagline": "Build reliable services."
    }
  ]
}
'@
curl.exe -X POST http://127.0.0.1:5000/ingest `
  -H "Content-Type: application/json" `
  --data-raw $body
```

The successful ingestion response is HTTP `201`:

```json
{"message":"Data ingested and matches recomputed."}
```

Unknown job or candidate IDs return HTTP `404`. Invalid ingestion JSON,
missing required fields, invalid field types, duplicate IDs, and database
constraint violations return HTTP `400` without leaving a partial replacement
in the database.

## Next steps

A production version could add authentication, pagination, request logging,
automated API integration tests, and PostgreSQL support for concurrent
multi-user workloads.
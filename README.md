# RecruiterFlow Take-Home Assignment

This repository contains the three parts of the Full Stack Developer Intern
take-home assignment. Each part is a self-contained project with its own
README:

- **QA automation** (`qa-automation/`) — Playwright and TypeScript tests for
  SauceDemo's web application and the ReqRes API.
- **Backend** (`backend/`) — a Flask and SQLite recruiter-matching API,
  together with the SQL Detective solutions and verification script.
- **Frontend** (`frontend/`) — a React and Redux Toolkit Trip Splitter
  application written in strict TypeScript.

The projects are intentionally separate. You can run and validate one section
without starting the others.

## Getting the code

Clone the repository and move into its directory:

```powershell
git clone https://github.com/GreeshmaShivakumar/RecruiterFlow-TakeHomeAssignment.git
cd RecruiterFlow-TakeHomeAssignment
```

If you already have the project files, start from the project directory and
skip these commands.

The commands below use Windows PowerShell. On macOS or Linux, use the
equivalent `cd`, `cp`, `python3`, and `curl` commands.

## Prerequisites

Install the following before running a section:

- Node.js 18 or newer and npm (QA automation and frontend)
- Python 3.10 or newer (backend)
- A ReqRes API key (QA API tests only)

Dependencies are installed separately because each section has its own
`package.json` or Python requirements file.

## Section A: QA automation

This section demonstrates browser and API test automation with Playwright.
The UI tests exercise login, locked-out login, adding and removing a product,
and logout on SauceDemo. The API tests use Playwright's request fixture to
create and retrieve users through ReqRes, including a not-found response.

From the repository root, install the dependencies and Chromium:

```powershell
cd qa-automation
npm install
npx playwright install chromium
Copy-Item .env.example .env
```

macOS/Linux equivalent:

```bash
cd qa-automation
npm install
npx playwright install chromium
cp .env.example .env
```

Open `.env`, set `REQRES_API_KEY` to your key, and run the complete suite:

```powershell
npm test
```

You can also run a specific group or test file:

```powershell
# UI tests only
npx playwright test tests/ui

# API tests only
npx playwright test tests/api

# A specific test file
npx playwright test tests/ui/login.spec.ts
npx playwright test tests/ui/cart.spec.ts
npx playwright test tests/api/users.spec.ts

# A specific test by name
npx playwright test -g "valid user sees the Products title"

# Run with the browser visible
npx playwright test --headed

# List all discovered tests
npx playwright test --list
```

See [qa-automation/README.md](./qa-automation/README.md) for the test
breakdown and project structure.

## Section B: Backend

This section provides an API for browsing jobs and candidates, ranking
candidate-job matches, and replacing the seeded data through a validated
ingestion endpoint. It uses a normalized SQLite schema and parameterized,
hand-written SQL. Matching is based primarily on required-skill overlap, with
experience, culture, and availability contributing to the final score.

From the `backend` directory, install Flask, seed the database, and start the
service. You may create and activate a virtual environment first if you prefer,
but it is not required:

```powershell
cd backend
python -m pip install -r requirements.txt
python seed.py
python app.py
```

The API listens on `http://127.0.0.1:5000`. It does not serve a web page at
`/`; use one of these routes instead:

- `GET /jobs`
- `GET /candidates`
- `GET /jobs/<id>/matches`
- `GET /candidates/<id>/matches`
- `POST /ingest`

For example:

```powershell
curl.exe http://127.0.0.1:5000/jobs/1/matches
```

macOS/Linux equivalent:

```bash
curl http://127.0.0.1:5000/jobs/1/matches
```

The SQL Detective solutions can be checked independently:

```powershell
python check_sql_detective.py
```

See [backend/README.md](./backend/README.md) for the scoring rules, request
format, response examples, and design decisions.

## Section C: Frontend

This section is a browser-based Trip Splitter. It has an expenses page and an
add-expense page, stores members and expenses in Redux Toolkit, persists data
in `localStorage`, and keeps calculation and validation rules in pure
TypeScript functions. It supports equal, exact-amount, and percentage splits,
category filtering, totals, balances, deletion confirmation, empty states,
and accessible form errors.

Install the dependencies and start the Vite development server:

```powershell
cd frontend
npm install
npm run dev
```

Useful validation commands are:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

The same npm commands work on macOS and Linux. For the backend on those
systems, use `python3` if `python` points to an older interpreter.

See [frontend/README.md](./frontend/README.md) for the application behavior,
money handling, and testing notes.

## Validation summary

The repository includes validation for all three sections:

- Frontend TypeScript checks, ESLint, Vitest tests, and production build.
- Backend database seeding, API behavior, SQL Detective verification, and
  Python compilation.
- QA Playwright UI and API tests.

Run the commands in the relevant section to reproduce the checks locally.
# QA automation

This project is a focused Playwright and TypeScript test suite. It validates
the SauceDemo user interface in a Chromium browser and exercises the ReqRes
API through Playwright's request fixture. The suite is independent of the
backend and frontend projects in this repository.

## Installation

From this directory, install the Node.js dependencies and the Chromium browser
used by the Playwright configuration:

```powershell
npm install
npx playwright install chromium
```

Create a local `.env` file from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace `your_key_here` with your ReqRes API key:

```dotenv
REQRES_API_KEY=your_key_here
```

The `.env` file is ignored by Git so the API key is not committed.

On macOS or Linux, use:

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

## Run the tests

```powershell
npm test
```

The configuration runs Chromium only.

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

If `REQRES_API_KEY` is not set, the three ReqRes API tests are skipped with a
clear message. The SauceDemo UI tests still run. ReqRes is a public
third-party service, so API tests also depend on internet access and the
service being available and accepting the supplied key.

## What's covered

### SauceDemo UI tests

- Standard user can log in and see the `Products` title.
- Locked-out user sees an error containing `locked out`.
- Standard user can add one product to the cart and see a badge showing `1`.
- Standard user can remove the product and the cart badge disappears.
- Standard user can log out from the side menu and return to the login page.

### ReqRes API tests

- `GET /api/users/2` returns status `200` and a non-empty email.
- `POST /api/users` returns status `201` and creates `morpheus`.
- `GET /api/users/23` returns status `404`.

The API tests use Playwright's built-in `request` fixture. Every request sends the `x-api-key` header from `REQRES_API_KEY`.

## Project structure

```text
pages/LoginPage.ts
playwright.config.ts
tsconfig.json
tests/ui/login.spec.ts
tests/ui/cart.spec.ts
tests/api/users.spec.ts
```

## Validation

All UI and API tests passed during development. The final full-suite command is:

```powershell
npm test
```

## Next steps

The suite could be extended with checkout and product-detail flows, response
schema assertions, and mocked API cases for rate limits or service outages.

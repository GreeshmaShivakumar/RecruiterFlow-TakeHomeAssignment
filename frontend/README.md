# Trip Splitter

This project is a browser-based trip expense tracker. It uses React for the
pages and forms, React Router for navigation, Redux Toolkit for the supplied
trip members and expenses, and `localStorage` for persistence in the current
browser. The calculation and validation rules live in pure TypeScript
functions so they can be tested independently of the UI.

## Installation and local development

From this directory, install the Node.js dependencies and start the Vite
development server:

```powershell
npm install
npm run dev
```

Vite prints the local URL in the terminal, normally
`http://localhost:5173`.

Other scripts:

- `npm run build` - typecheck and create a production build
- `npm run typecheck` - run `tsc --noEmit`
- `npm run lint` - run ESLint
- `npm run test` - run the Vitest test suite

The tests cover money and split calculations, balances, validation, form
submission, category filtering, confirmed deletion, and settlement suggestions.

## Implemented behavior

The app supports equal, exact-amount, and percentage splits; input
validation; category filtering; totals and balances; deletion with
confirmation; empty states; responsive table scrolling; and accessible form
error associations. Opening an expense split shows each member and their
calculated share with a clearly labelled, keyboard-accessible details control.
The page also shows a trip summary, category and sorting controls, and consolidated payment
suggestions in one column per person, clearly labelled with what that person
owes each other member across all expenses. Each column includes its total,
opposite obligations between a pair are netted into one payment direction,
and zero-value relationships are shown as ₹0.00. Newest-first remains the
default expense order.
A production version would additionally need a backend, authentication, and
shared storage between devices.

## Three decisions

1. **Store money as integer paise.** This avoids floating-point rounding problems and makes exact equality checks reliable.
2. **Keep business rules in `src/logic/`.** Pure functions are easier to test and keep React components focused on rendering and events.
3. **Use Redux only for supplied members and expenses.** The sample trip
members are fixed application data; form values and errors stay local to the
form, so unfinished input is not global application state.

## Extra-paisa rule

For equal and percent splits, each share is first floored. Any leftover paise are then given one at a time to the first members in the order they appear in the split. This same rule is used everywhere so every split totals exactly to the original amount.

## What I would improve with another day

I would add an accessible modal for deletion, more comprehensive page-level tests, clearer visual balance indicators, and an export/import option for trip data. I would also add a backend so multiple people could view and edit the same trip.
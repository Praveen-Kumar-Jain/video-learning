# Frontend: automated test inventory

Run with: `npm run test --workspace client` (Vitest + React Testing Library
+ jsdom).

## `client/src/components/Status.test.jsx`

| # | Case | Expected |
| --- | --- | --- |
| 1 | `<Status loading />` | Renders `Loading…` |
| 2 | `<Status error={{ message: 'Request failed' }} />` | Renders `Request failed` |
| 3 | `<Status empty="No records">ignored</Status>` (no loading/error) | Renders `No records`, not the children |

## `client/src/pages/LoginPage.test.jsx`

| # | Case | Expected |
| --- | --- | --- |
| 4 | Render the login form | Email/password fields present with seed-credential defaults |
| 5 | Clear and type a new email into the Email field | Field value updates; "Sign in" button remains enabled |

`api.js` is mocked (`vi.mock('../api.js', ...)`) so this test exercises only
form rendering/interaction, not a real network call.

## What this suite intentionally does not cover

Every other page (`VideosPage`, `QuestionsPage`, `AssignmentsPage`,
`ReportsPage`, `HomePage`, `PlayerPage`) depends on `@tanstack/react-query`,
routing context (`useParams`, `<Link>`), and real Axios calls, and currently
has no automated test — this is covered instead by the manual E2E flows in
[04-e2e-admin-flow-test-plan.md](04-e2e-admin-flow-test-plan.md) and
[05-e2e-learner-flow-test-plan.md](05-e2e-learner-flow-test-plan.md). See
[`docs/frontend/08-shared-components-and-data-fetching.md`](../frontend/08-shared-components-and-data-fetching.md)
for what a future test harness for these pages would need (a
`QueryClientProvider` wrapper and a mocked Axios instance, following the
same `vi.mock('../api.js', ...)` pattern already used by `LoginPage.test.jsx`).

## Also run

```bash
npm run build --workspace client
```

This is a meaningful automated check on its own: it runs the full Vite/
esbuild compile over every page and component, so a broken import (e.g. a
stale path after the `pages/`/`components/` restructure), a JSX syntax error,
or an unresolved module reference fails the build immediately rather than
only being caught by manually opening every page in a browser.

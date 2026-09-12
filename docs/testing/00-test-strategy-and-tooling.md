# Test strategy and tooling

## Levels of testing in this project

| Level | Tooling | What it covers | Where |
| --- | --- | --- | --- |
| Unit | Vitest | Pure functions and Mongoose schema validation, no DB/network | `server/test/grading.test.js`, `server/test/models.test.js` |
| Route/auth-boundary | Vitest + Supertest | Every route rejects unauthenticated/wrong-role requests correctly, and basic input validation, without needing a live database | `server/test/*.routes.test.js` |
| Component | Vitest + React Testing Library | Shared UI states and the login form render/behave correctly | `client/src/components/Status.test.jsx`, `client/src/pages/LoginPage.test.jsx` |
| Build | `vite build` | The client compiles without errors | `npm run build --workspace client` |
| Manual / end-to-end | Documented step-by-step flows in this folder | Full request/response cycles against a real database, and the full browser UI | [04-e2e-admin-flow-test-plan.md](04-e2e-admin-flow-test-plan.md), [05-e2e-learner-flow-test-plan.md](05-e2e-learner-flow-test-plan.md) |

## Why the split is where it is (and what's deliberately *not* automated)

This project deliberately does **not** have a MongoDB-backed automated
integration suite (e.g. hitting real routes with a real database via
`mongodb-memory-server`). That was an explicit scope decision, not an
oversight:

- The route tests that exist check the **authorization boundary** (every
  protected route correctly returns `401`/`403` without a valid token/role)
  and **input validation** (malformed bodies return `400` with the expected
  shape) — both of which are meaningful, fast, deterministic checks that
  don't need a database.
- Full request/response-cycle correctness (does creating a question really
  persist the right `correctOptionIds`, does deleting a video really cascade)
  was instead verified **manually, once, against a real temporary MongoDB
  instance** during development (seed script run, then a scripted sequence
  of `curl` calls exercising create/edit/delete/report endpoints and
  confirming the exact response shapes) — see
  [01-backend-automated-tests.md](01-backend-automated-tests.md) for what
  that session covered. This caught real issues (subdocument `_id` timing,
  etc.) before they reached the codebase, without committing to maintaining
  a permanent DB-backed suite.
- If deeper backend regression coverage becomes a priority later, promoting
  that manual verification session into a permanent `mongodb-memory-server`-
  backed Vitest suite is the natural next step — see
  [`docs/backend/12-future-work.md`](../backend/12-future-work.md).

Similarly, the frontend has automated tests for the two components simple
enough to render in isolation with minimal setup (`Status`, `LoginPage`).
Every other page depends on React Query + Axios + routing context, and is
covered instead by the detailed **manual E2E flows** in this folder — see
[03-frontend-automated-tests.md](03-frontend-automated-tests.md) for the
current automated coverage and what a future component-test harness would
need.

## Running everything that *is* automated

```bash
npm run test --workspace server   # unit + route/auth-boundary tests
npm run test --workspace client   # component tests
npm run build --workspace client  # compile check
npm run format:check              # Prettier formatting check (repo root)
```

All four should be run before considering a change complete. None require a
running MongoDB instance or a running dev server.

## How to read the rest of this folder

- [01-backend-automated-tests.md](01-backend-automated-tests.md) and
  [02-backend-api-manual-test-cases.md](02-backend-api-manual-test-cases.md) —
  backend, automated then manual/full-cycle.
- [03-frontend-automated-tests.md](03-frontend-automated-tests.md) — frontend
  automated coverage.
- [04-e2e-admin-flow-test-plan.md](04-e2e-admin-flow-test-plan.md) and
  [05-e2e-learner-flow-test-plan.md](05-e2e-learner-flow-test-plan.md) —
  full browser walkthroughs, admin then learner.
- [06-edge-cases-and-negative-scenarios.md](06-edge-cases-and-negative-scenarios.md) —
  cross-cutting edge cases that don't belong to one single flow.
- [07-regression-checklist-and-release-gate.md](07-regression-checklist-and-release-gate.md) —
  the condensed "run this before shipping" checklist.

# Backend: automated test inventory

Run with: `npm run test --workspace server` (Vitest + Supertest, no database
required).

## `server/test/grading.test.js` — `gradeResponse` unit tests

| # | Case | Input | Expected |
| --- | --- | --- | --- |
| 1 | Single-choice, correct option submitted | `answer = correctOption._id` | `true` |
| 2 | Single-choice, wrong option submitted | `answer = wrongOption._id` | `false` |
| 3 | Multiple-choice, correct set submitted out of order | `answer = [b._id, a._id]` where correct = `[a, b]` | `true` |
| 4 | Multiple-choice, missing one correct option | `answer = [a._id]` where correct = `[a, b]` | `false` |
| 5 | Multiple-choice, correct set plus one extra wrong option | `answer = [a._id, b._id, c._id]` where correct = `[a, b]` | `false` |
| 6 | Short answer, case/whitespace-insensitive match | `answer = '  paris  '`, accepted = `['Paris']` | `true` |
| 7 | Short answer, no match | `answer = 'London'`, accepted = `['Paris']` | `false` |

## `server/test/models.test.js` — Mongoose schema validation

| # | Case | Expected |
| --- | --- | --- |
| 8 | `new User()` with no fields | `validateSync().errors` has `email` |
| 9 | `new Video()` with no fields | `validateSync().errors` has `videoUrl` |
| 10 | `new Question()` with no fields | `validateSync().errors` has `prompt` |
| 11 | `new Assignment()` with no fields | `validateSync().errors` has `videoId` |
| 12 | `new Progress()` with no fields | `validateSync().errors` has `assignmentId` |
| 13 | `new Response()` with no fields | `validateSync().errors` has `questionId` |
| 14 | `User.role = 'owner'` (not in enum) | `validateSync().errors.role` is defined |
| 15 | `Question.type = 'essay'` (not in enum) | `validateSync().errors.type` is defined |
| 16 | `Progress.status = 'paused'` (not in enum) | `validateSync().errors.status` is defined |

## `server/test/app.test.js` — app shell

| # | Case | Expected |
| --- | --- | --- |
| 17 | `GET /api/health` | `200 { status: 'ok' }` |
| 18 | `GET /api/missing` (unknown route) | `404`, message contains `'was not found'` |

## `server/test/auth.routes.test.js` — auth boundary

| # | Case | Expected |
| --- | --- | --- |
| 19 | `POST /api/auth/login` with `email: 'not-an-email', password: 'short'` | `400 { message: 'Validation failed' }` |
| 20 | `GET /api/auth/me` with no token | `401` |

## `server/test/video.routes.test.js` — auth boundary

| # | Case | Expected |
| --- | --- | --- |
| 21 | `GET /api/videos` with no token | `401` |
| 22 | `POST /api/videos` with no token | `401` |
| 23 | `GET /api/videos/a/questions` with no token | `401` |
| 24 | `POST /api/videos/a/questions` with no token | `401` |

## `server/test/assignment.routes.test.js` — auth boundary

| # | Case | Expected |
| --- | --- | --- |
| 25 | `POST /api/assignments` with no token | `401` |
| 26 | `GET /api/assignments` with no token | `401` |
| 27 | `GET /api/assignments/me` with no token | `401` |
| 28 | `GET /api/assignments/a/play` with no token | `401` |
| 29 | `GET /api/reports/videos/a/progress` with no token | `401` |
| 30 | `GET /api/reports/videos/a/responses` with no token | `401` |
| 31 | `GET /api/users/learners` with no token | `401` |

## What this suite intentionally does not cover

Full request/response cycles against a real database (does creating a
question actually persist the right answer key, does a duplicate assignment
actually get rejected with `409`, etc.) — see
[00-test-strategy-and-tooling.md](00-test-strategy-and-tooling.md) for why,
and [02-backend-api-manual-test-cases.md](02-backend-api-manual-test-cases.md)
for that coverage as a manual/scripted test plan.

## Adding to this suite

New pure functions (like `gradeResponse`) should get unit tests here with no
database dependency. New routes should get at least an auth-boundary test
(unauthenticated → `401`, wrong role → `403`) added to the relevant
`*.routes.test.js` file, following the existing `it.each([...])` pattern used
for repetitive boundary checks.

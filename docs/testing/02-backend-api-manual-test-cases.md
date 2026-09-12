# Backend: full API manual/scripted test cases

These exercise full request/response cycles against a **real** MongoDB
instance (local, Atlas, or a temporary `mongodb-memory-server` — see
[00-test-strategy-and-tooling.md](00-test-strategy-and-tooling.md) for why
this isn't a permanent automated suite yet). Run `npm run seed --workspace
server` first so the fixture data referenced below (6 courses, 9 users)
exists. All examples assume the API is reachable at `http://localhost:5000/api`
and use the seeded `admin@example.com` / `learner@example.com` accounts
(password `Password123!`) unless noted.

Each table lists: the case, the request, and the expected result. "✓ verified"
cases were confirmed against a live temporary MongoDB instance during
development; the rest follow directly from the route logic documented in
`docs/backend/` and should be re-run whenever that logic changes.

## Auth

| # | Case | Request | Expected |
| --- | --- | --- | --- |
| 1 | Valid login | `POST /auth/login { admin@example.com, Password123! }` | `200`, `token` + `user.role === 'admin'` — ✓ verified |
| 2 | Wrong password | `POST /auth/login { admin@example.com, WrongPass1! }` | `401 Invalid email or password` |
| 3 | Unknown email | `POST /auth/login { nobody@example.com, Password123! }` | `401 Invalid email or password` (same message as #2 — no user enumeration) |
| 4 | Malformed email | `POST /auth/login { not-an-email, short }` | `400 Validation failed`, `errors` array with `email`/`password` issues |
| 5 | Password under 8 chars | `POST /auth/login { admin@example.com, 1234567 }` | `400 Validation failed` |
| 6 | `GET /auth/me` with valid token | — | `200`, matches logged-in user — ✓ verified (implicitly, via every other authenticated call) |
| 7 | `GET /auth/me` with no token | — | `401` |
| 8 | `GET /auth/me` with garbled token | `Authorization: Bearer garbage` | `401 Invalid or expired access token` |
| 9 | `GET /auth/me` with token for a since-deleted user | — | `401 User no longer exists` |

## Videos

| # | Case | Expected |
| --- | --- | --- |
| 10 | `GET /videos` as admin | All 6 seeded videos, published and draft — ✓ verified |
| 11 | `GET /videos` as learner | Only videos the learner has a **published** assignment for — ✓ verified (`learner@example.com` sees exactly their 3 assigned courses) |
| 12 | `POST /videos` valid payload as admin | `201`, video created |
| 13 | `POST /videos` with invalid `videoUrl` (not a URL) | `400 Validation failed` |
| 14 | `POST /videos` with `durationSeconds: -5` | `400 Validation failed` |
| 15 | `POST /videos` with missing `title` | `400 Validation failed` |
| 16 | `POST /videos` as learner | `403` |
| 17 | `PATCH /videos/:id` partial update (title only) as admin | `200`, only title changes, other fields unchanged |
| 18 | `PATCH /videos/:id` for a non-existent id | `404 Video not found` |
| 19 | `PATCH /videos/:id` with a syntactically invalid ObjectId (`/videos/abc`) | `400 Invalid resource identifier` (Mongoose `CastError`) |
| 20 | `PATCH /videos/:id/publish { isPublished: true }` | `200`, `isPublished` flips — ✓ verified |
| 21 | `DELETE /videos/:id` as admin, video has questions + assignments | `204`; a follow-up `GET /videos/:id/questions` returns empty; its assignments are gone from `GET /assignments` — ✓ verified |
| 22 | `DELETE /videos/:id` for a non-existent id | `404 Video not found` |
| 23 | `DELETE /videos/:id` as learner | `403` |
| 24 | Deleting video A does not affect video B's questions/assignments | Video B's questions/assignments list unchanged — ✓ verified |

## Questions

| # | Case | Expected |
| --- | --- | --- |
| 25 | `GET /videos/:id/questions` as admin | Full question objects including `correctOptionIds`/`acceptedAnswers` — ✓ verified |
| 26 | `GET /videos/:id/questions` as learner | Same questions, `correctOptionIds`/`acceptedAnswers` stripped from every item — ✓ verified |
| 27 | `POST /videos/:id/questions`, single-choice, 1 option marked correct | `201`, response's `correctOptionIds` = that option's `_id` — ✓ verified |
| 28 | `POST /videos/:id/questions`, multiple-choice, 2 options marked correct | `201`, `correctOptionIds` has both — ✓ verified |
| 29 | `POST /videos/:id/questions`, choice type, 0 options marked correct | `400 Choice questions need at least one correct option` — ✓ verified |
| 30 | `POST /videos/:id/questions`, choice type, only 1 option provided | `400 Choice questions need at least two options` |
| 31 | `POST /videos/:id/questions`, short-answer, no `acceptedAnswers` | `400 Short-answer questions need at least one accepted answer` |
| 32 | `POST /videos/:id/questions`, `timestampSeconds >= video.durationSeconds` | `400 Question timestamp must be within the video duration` |
| 33 | `POST /videos/:id/questions`, `timestampSeconds` duplicate for the same video | `409 A record with that value already exists` (unique index) |
| 34 | `POST /videos/:id/questions` for a non-existent video | `404 Video not found` |
| 35 | `PATCH /videos/questions/:id`, change which option is correct | `200`, `correctOptionIds` reflects the *new* option `_id`s, not the old ones — ✓ verified |
| 36 | `PATCH /videos/questions/:id` for a non-existent question | `404 Question not found` |
| 37 | `DELETE /videos/questions/:id` | `204`; question gone from subsequent `GET` — ✓ verified |
| 38 | `DELETE /videos/questions/:id` for a non-existent question | `404 Question not found` |
| 39 | Any question route as learner (`POST`/`PATCH`/`DELETE`) | `403` |

## Assignments

| # | Case | Expected |
| --- | --- | --- |
| 40 | `POST /assignments` valid published video + learner | `201`, assignment created — ✓ verified |
| 41 | `POST /assignments` targeting an **unpublished** video | `400 Publish the video before assigning it to learners` |
| 42 | `POST /assignments` targeting a non-existent video id | `404 Video not found` |
| 43 | `POST /assignments` with `learnerId` pointing at an **admin** account | `400 Assignments can only be made to learners` |
| 44 | `POST /assignments` with `learnerId` pointing at a non-existent user | `400 Assignments can only be made to learners` |
| 45 | `POST /assignments` for the same `{videoId, learnerId}` pair twice | Second call → `409` (unique index) |
| 46 | `POST /assignments` as learner | `403` |
| 47 | `GET /assignments` as admin, optional `?videoId=` filter | Returns only that video's assignments when filtered |
| 48 | `GET /assignments` as learner | `403` |
| 49 | `GET /assignments/me` as a learner with mixed states | Returns `{ assignment, video, progress }` per assignment; `progress: null` for not-started — ✓ verified |
| 50 | `GET /assignments/me` after the assigned video is unpublished | That assignment silently disappears from the list |
| 51 | `GET /assignments/me` as admin | `403` |
| 52 | `DELETE /assignments/:id`, assignment has progress + responses | `204`; its `Progress`/`Response` rows are gone; a *different* assignment's rows survive |
| 53 | `DELETE /assignments/:id` for a non-existent id | `404 Assignment not found` |
| 54 | `DELETE /assignments/:id` as learner | `403` |

## Playback and progress

| # | Case | Expected |
| --- | --- | --- |
| 55 | `GET /assignments/:id/play` for the caller's own assignment | `200`, `{ assignment, video, questions, progress }`; `questions[].options` present, no `correctOptionIds`/`acceptedAnswers` on any question — ✓ verified |
| 56 | `GET /assignments/:id/play` for **another learner's** assignment id | `404 Assignment not found` (not 403 — see `docs/backend/02-authorization-and-roles.md`) |
| 57 | `GET /assignments/:id/play` after the video is unpublished post-assignment | `404 Video is unavailable` |
| 58 | `GET /assignments/:id/play` as admin | `403` |
| 59 | `PATCH /assignments/:id/progress`, first call on a fresh assignment | `200`, creates the `Progress` row (upsert) |
| 60 | `PATCH /assignments/:id/progress`, second call | `200`, updates the same row (no duplicate) |
| 61 | `PATCH /assignments/:id/progress` with `status: 'paused'` (not a valid enum value) | `400 Validation failed` |
| 62 | `PATCH /assignments/:id/progress` with `completionPercentage: 150` | `400 Validation failed` |
| 63 | `PATCH /assignments/:id/progress` with `lastWatchedSecond: -1` | `400 Validation failed` |
| 64 | `PATCH /assignments/:id/progress` for another learner's assignment id | `404 Assignment not found` |

## Responses (answer submission)

| # | Case | Expected |
| --- | --- | --- |
| 65 | `POST /assignments/:id/responses` with a valid `questionId` for that video | `201`, `response` + updated `progress.answeredQuestionIds` includes the question |
| 66 | Same question submitted twice (different answer) | Second call `201`, overwrites the first (`Response` upsert); `answeredQuestionIds` still has exactly one entry for that question, not two |
| 67 | `questionId` that belongs to a **different** video | `400 Question does not belong to this video` |
| 68 | `questionId` that doesn't exist at all | `400 Question does not belong to this video` |
| 69 | `answer` as a string for a `multiple` question, or an array for a `single`/`short` question | Accepted by the schema (`z.union([string, array])`); grading still resolves correctly since `gradeResponse` normalizes both sides — see [`docs/backend/07-responses-and-grading.md`](../backend/07-responses-and-grading.md) |
| 70 | Submitting for another learner's assignment id | `404 Assignment not found` |
| 71 | Submitting as admin | `403` |

## Reports (admin only)

| # | Case | Expected |
| --- | --- | --- |
| 72 | `GET /reports/videos/:id/progress` for a seeded course | One row per assignment, learner name/email populated, correct status/percentage per the seed script's design — ✓ verified |
| 73 | `GET /reports/videos/:id/progress` for a video with assignments but none yet started | Rows present with the synthetic `not_started`/`0%` default |
| 74 | `GET /reports/videos/:id/progress` for a video with zero assignments | `200`, empty `learners: []` (not an error) |
| 75 | `GET /reports/videos/:id/responses` for a seeded course | Each row's `isCorrect`, `learnerAnswerLabel`, `correctAnswerLabel` match hand-computed expectations for a mix of single/multiple/short questions — ✓ verified |
| 76 | `GET /reports/videos/:id/responses` where a question was deleted after being answered | That response is silently omitted, not a `500` |
| 77 | Either report route as a learner | `403` |
| 78 | Either report route for a non-existent `videoId` | `200`, empty array (the route doesn't validate the video exists — it just finds zero matching assignments) |

## Users

| # | Case | Expected |
| --- | --- | --- |
| 79 | `GET /users/learners` as admin | List of all learner accounts (no admins), sorted by name, no `passwordHash` field — ✓ verified |
| 80 | `GET /users/learners` as learner | `403` |

## Docs

| # | Case | Expected |
| --- | --- | --- |
| 81 | `GET /docs` | `301` → `200` after redirect to `/docs/`, renders Swagger UI HTML — ✓ verified |
| 82 | `GET /docs.json` | `200`, valid JSON, `info.title` set, `paths` covers all 6 route groups — ✓ verified |

## Cross-cutting error-shape checks

| # | Case | Expected |
| --- | --- | --- |
| 83 | Any Zod validation failure | `400 { message: 'Validation failed', errors: [...] }` |
| 84 | Any invalid ObjectId in a path param | `400 { message: 'Invalid resource identifier' }` |
| 85 | Any unique-index violation | `409 { message: 'A record with that value already exists' }` |
| 86 | Any unmatched route | `404 { message: 'Route <METHOD> <path> was not found' }` |

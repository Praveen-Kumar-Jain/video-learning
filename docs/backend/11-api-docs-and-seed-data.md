# API documentation and seed data

Source: [`server/openapi.yaml`](../../server/openapi.yaml),
[`server/src/app.js`](../../server/src/app.js),
[`server/src/seed.js`](../../server/src/seed.js).

## What was built

### Swagger / OpenAPI docs

A hand-written `openapi.yaml` describing every route group (auth, videos,
questions, assignments, reports, users), mounted at:

- `GET /api/docs` — interactive Swagger UI.
- `GET /api/docs.json` — the raw spec, for tooling (Postman import, codegen).

### Seed data

A rewritten `server/src/seed.js` that builds a realistic small-company
training catalog instead of a single demo video: 1 admin, 8 learners, and 6
course videos (one left as an unpublished draft), each with 2-4 timestamp
questions carrying a real answer key, and assignments/progress/responses
deliberately spread across learners to cover every state the UI/reports can
show.

## How it works

**Docs**: `app.js` reads `openapi.yaml` once at startup with `js-yaml`, then
mounts it via `swagger-ui-express`:

```js
const openapiDocument = yaml.load(readFileSync(path.join(dirname, '..', 'openapi.yaml'), 'utf8'));
app.get('/api/docs.json', (req, res) => res.json(openapiDocument));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
```

The spec documents request/response schemas (`components.schemas`), a
`bearerAuth` security scheme applied globally, and one `path` entry per
route including the ones that intentionally diverge in behavior by role
(e.g. `GET /videos`).

**Seed data structure**: `courseDefinitions` is a plain array of
`{ slug, title, description, videoUrl, durationSeconds, isPublished,
questions: [...] }`. For each course, the script:
1. Creates the `Video`.
2. Builds each `Question` via `buildQuestion` (which delegates to the same
   `applyOptions` helper the API uses — see
   [04-questions-and-answer-key.md](04-questions-and-answer-key.md)) — so the
   seeded answer keys are derived through the exact same code path a real
   admin action would use, not a separate ad-hoc shortcut.

`learnerDefinitions` lists 8 learners (including the documented
`learner@example.com`). An `assign(email, slug, outcome)` orchestration
function then creates specific, named demo scenarios:

| Outcome | What it produces |
| --- | --- |
| `not_started` | An `Assignment` row only — no `Progress` document at all. |
| `in_progress` | Roughly half the video's questions answered (deliberately mixing correct/incorrect via `answerFor`), `Progress.status = 'in_progress'`, percentage < 100. |
| `completed_correct` | Every question answered correctly, `status = 'completed'`, 100%. |
| `completed_mixed` | Every question answered, but with some intentionally wrong (`answerFor(question, allCorrect=false)`), `status = 'completed'`, 100%. |

`answerFor(question, correct)` picks a plausible answer: the actual correct
option(s)/accepted answer when `correct` is true, or the first
non-correct option (or an obviously-wrong string like `'not sure'` for short
answer) otherwise — so the "wrong" answers in the seed are still realistic
submissions, not garbage data.

The specific assignment calls at the bottom of the file are hand-picked so
that:
- `learner@example.com` (the documented demo login) lands in **one
  in-progress, one completed, one not-started** course — a single login
  immediately shows every state.
- `emma.rossi@example.com` has **zero assignments**, exercising the
  learner-home empty state.
- One course (`Daily Stand-up Etiquette`) is **never published**, exercising
  the admin "Draft" pill and confirming it's correctly excluded from the
  assignment dropdown.

## Why it works this way

- **A static `openapi.yaml` instead of inline JSDoc route annotations**:
  this codebase's routes are intentionally compact (a handful of chained
  `.get()`/`.post()` calls per file); scattering multi-line JSDoc `@openapi`
  blocks through them would roughly double their length and make the actual
  logic harder to scan. A single YAML file is also easier to review as a
  complete picture of the API surface in one diff, and easier to keep in
  sync deliberately (it's the *only* place route contracts are documented,
  so there's no "which copy is stale" ambiguity).
- **Seeding through the same `applyOptions`/grading code the API uses**,
  rather than writing `correctOptionIds` by hand in the seed script: this
  means the seed script doubles as a smoke test of that logic on every run,
  and guarantees the seeded answer keys behave identically to one an admin
  creates through the UI.
- **Named outcome buckets (`not_started`/`in_progress`/`completed_correct`/
  `completed_mixed`) instead of ad hoc per-learner data**: makes the seed
  script's intent legible — each `assign(...)` call at the bottom reads as a
  one-line spec of "this learner is in this demo state for this course,"
  rather than requiring the reader to reverse-engineer intent from raw
  document values.
- **Deliberately covering every UI/report rendering branch** in the seed
  data: a fresh `npm run seed` immediately exercises the not-started empty
  state, the in-progress progress bar, the completed badge, the
  all-correct and some-wrong report rows, and the zero-assignments empty
  state — without a developer or QA engineer having to manually construct
  each scenario by hand before it can be reviewed.

## Test cases

The seed script was manually smoke-tested end-to-end against a real (though
temporary/in-memory) MongoDB instance during development: run `npm run seed`,
then hit `/api/videos`, `/api/reports/videos/:id/progress`, and
`/api/reports/videos/:id/responses` as admin, and `/api/assignments/me` as
`learner@example.com`, and confirm the counts/states match the table above.
See
[`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md)
for the exact request/response pairs used.

For the Swagger docs: `GET /api/docs` returns `200` and renders the Swagger
UI HTML; `GET /api/docs.json` returns valid JSON with `info.title` set and a
non-empty `paths` map covering all six route groups.

## What further can be done

- **Keep the OpenAPI spec in CI** — add a lint/validate step (e.g.
  `@redocly/cli lint`) so a broken or drifted spec fails the build instead of
  being caught by a human noticing the docs look wrong.
- **Generate a typed API client** from `openapi.json` for the frontend,
  instead of hand-written Axios calls with no compile-time contract checking.
- **Seed data variants**: a `--minimal` flag for a fast, tiny dataset for
  unit-test setup, versus the current "full demo" dataset for manual/QA use.
- **Idempotent/partial seeding** (upsert instead of wipe-and-recreate) so the
  seed script could be safely re-run against a database with real user
  activity without nuking it — today it always starts by deleting every
  collection.

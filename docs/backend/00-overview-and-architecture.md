# Backend overview and architecture

## What this is

A Node.js + Express API backing a timestamp-quiz video learning platform. It
authenticates users, lets admins manage a catalog of video lessons and
timestamp questions (with an answer key), lets admins assign lessons to
learners, and lets learners play lessons while their progress and answers are
recorded and graded.

## Stack and why

| Concern | Choice | Why |
| --- | --- | --- |
| HTTP framework | Express 4 | Minimal, unopinionated, easy to reason about for a small route surface. No need for Nest's DI/module system at this scale. |
| Data layer | MongoDB + Mongoose | The domain is naturally document-shaped (a question's options are an embedded list, not a separate joined table), and Mongoose gives schema validation + subdocument `_id` management for free. |
| Auth | Stateless JWT (`jsonwebtoken`) | No session store to run/scale; a bearer token is enough for a single-page app talking to one API. |
| Validation | Zod | Schema-first request validation with good TypeScript-free ergonomics in JS; errors are structured and easy to turn into consistent 400 responses. |
| Docs | Static OpenAPI (`openapi.yaml`) + `swagger-ui-express` | See [11-api-docs-and-seed-data.md](11-api-docs-and-seed-data.md) for why a static spec was chosen over inline JSDoc annotations. |

## Folder layout

```
server/
  openapi.yaml           # API spec, served at /api/docs and /api/docs.json
  src/
    app.js               # Express app wiring: middleware, routes, docs, error handling
    server.js            # Boot: connect DB, start HTTP listener
    config/
      env.js             # Reads/validates required env vars
      database.js        # Mongoose connection
    middleware/
      auth.js             # requireAuth, requireRole
      error.js             # notFound + centralized errorHandler
    models/               # One Mongoose schema per collection
    routes/               # One router per resource group
    utils/
      asyncHandler.js      # Wraps async route handlers so thrown errors reach errorHandler
      grading.js            # Pure function: is a submitted answer correct?
      questionOptions.js    # Derives correctOptionIds from {text, isCorrect} input
    seed.js               # Demo-data generator (see 11-api-docs-and-seed-data.md)
  test/                   # Vitest + Supertest
```

This mirrors a fairly conventional layered Express structure: `routes` are thin
HTTP adapters, `models` own schema/validation, `middleware` is cross-cutting,
`utils` holds logic that's reused across routes/scripts (grading and
answer-key derivation are used by both the API routes and the seed script —
see [09-validation-and-error-handling.md](09-validation-and-error-handling.md)
and [07-responses-and-grading.md](07-responses-and-grading.md)).

## Request flow

1. A client sends a request with `Authorization: Bearer <token>` (except
   `POST /api/auth/login` and the health/docs endpoints).
2. `requireAuth` (`server/src/middleware/auth.js`) verifies the JWT, loads the
   `User` document, and attaches it to `req.user`.
3. `requireRole('admin' | 'learner')` gates admin-only or learner-only routes.
4. The route handler parses `req.body`/`req.params`/`req.query` with a Zod
   schema, performs the Mongoose read/write, and returns JSON.
5. Anything thrown (a Zod error, a Mongoose cast/duplicate-key error, or
   anything else) is caught by `asyncHandler` and normalized by the shared
   `errorHandler`.

## Data model at a glance

```
User (admin | learner)
  └─< Video (createdBy)
        └─< Question (videoId)
        └─< Assignment (videoId, learnerId → User)
              └─ Progress (assignmentId, 1:1)
              └─< Response (assignmentId, questionId → Question)
```

Full field-by-field detail is in
[10-database-schema.md](10-database-schema.md).

## Where to go next

Each of the other backend docs covers one feature slice end-to-end (what was
built, how, and why it was built that way), followed by
[12-future-work.md](12-future-work.md) for what's intentionally deferred.

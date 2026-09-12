# Database schema

Source: every file under [`server/src/models/`](../../server/src/models/).

## What was built

Six Mongoose collections, each mapping to one concern in the domain:

| Model | Purpose | Key fields | Indexes |
| --- | --- | --- | --- |
| `User` | Account + role | `name`, `email` (unique), `passwordHash` (`select: false`), `role` (`admin`\|`learner`) | unique `email` |
| `Video` | A lesson | `title`, `description`, `thumbnailUrl`, `videoUrl`, `durationSeconds`, `isPublished`, `createdBy` (→ User) | — |
| `Question` | A timestamp quiz question on a video | `videoId` (→ Video), `timestampSeconds`, `type` (`single`\|`multiple`\|`short`), `prompt`, `options: [{ text }]`, `correctOptionIds: [ObjectId]`, `acceptedAnswers: [String]` | unique `{ videoId, timestampSeconds }` |
| `Assignment` | Learner ↔ video grant | `videoId` (→ Video), `learnerId` (→ User), `assignedBy` (→ User) | unique `{ videoId, learnerId }` |
| `Progress` | Playback state for one assignment | `assignmentId` (→ Assignment, unique), `lastWatchedSecond`, `completionPercentage`, `status`, `answeredQuestionIds: [ObjectId]` | unique `assignmentId` |
| `Response` | One learner's answer to one question | `assignmentId` (→ Assignment), `questionId` (→ Question), `answer` (Mixed) | unique `{ assignmentId, questionId }` |

Every model has Mongoose `timestamps: true` (`createdAt`/`updatedAt`).

## Relationships

```
User (role=admin) ──createdBy──> Video ──videoId──> Question
                                    │
User (role=learner) ──learnerId──┐ │
                                  ▼ ▼
                              Assignment
                              │        │
                        (1:1) │        │ (1:many)
                              ▼        ▼
                          Progress   Response ──questionId──> Question
```

`Progress` is 1:1 with `Assignment` (enforced by a unique index on
`assignmentId`, not a schema-level embed) — it's modeled as a separate
collection rather than embedded fields on `Assignment` so it can be
independently upserted without touching the assignment document.

## Why it's modeled this way

- **Normalized (referenced), not embedded, relationships**: a `Question`
  references its `Video` by ID rather than videos embedding an array of
  question subdocuments, because questions are frequently read/written
  independently of the video document (create one question, edit one
  question) — embedding would mean rewriting the entire video document (and
  its whole options history) for every question edit, and would make the
  unique `{videoId, timestampSeconds}` constraint awkward to express.
- **`options` *is* embedded** inside `Question`, though, because options
  have no independent existence or lifecycle outside their question — they
  are always read and written as a unit with the question, which is exactly
  the case embedding is good for.
- **Compound unique indexes as data-integrity guarantees**, not just
  UI/route-level checks: `{videoId, timestampSeconds}` on `Question`,
  `{videoId, learnerId}` on `Assignment`, and `{assignmentId, questionId}` on
  `Response` all encode "this combination must be unique" at the database
  level, so even a bug in route logic (or a future direct-DB script) can't
  silently create duplicates.
- **`Progress` and `Response` as separate collections from `Assignment`**
  rather than fields on `Assignment`: they have different write patterns
  (progress updates frequently and is a single row; responses are appended,
  one per question) and different cascade-delete needs, so keeping them
  separate keeps each write cheap and targeted.
- **`passwordHash` with `select: false`**: see
  [01-authentication.md](01-authentication.md).

## Test cases

`server/test/models.test.js` covers required-field validation (a blank
document for each model fails validation on its key required field) and
enum enforcement (`role: 'owner'`, `type: 'essay'`, `status: 'paused'` all
fail `validateSync`). See
[`docs/testing/01-backend-automated-tests.md`](../testing/01-backend-automated-tests.md)
for the full list, and
[`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md)
for the unique-index conflict cases exercised through the API.

## What further can be done

- **Soft deletes** (`archivedAt`/`deletedAt`) instead of hard `deleteMany`/
  `findByIdAndDelete` everywhere, if historical data needs to survive
  content changes (see [03-videos-feature.md](03-videos-feature.md)).
- **Schema-level referential integrity checks** (Mongo has none natively) —
  today, cascading deletes are implemented by hand in each route; a
  background consistency-check job would catch anything that slips through.
- **Read-model denormalization** if reporting queries grow — e.g. a
  materialized "learner progress summary" collection, if the in-memory joins
  in `report.routes.js`/`assignment.routes.js` ever become a bottleneck at
  scale.

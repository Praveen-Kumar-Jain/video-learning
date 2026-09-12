# Assignments feature

Source: [`server/src/models/Assignment.js`](../../server/src/models/Assignment.js),
[`server/src/routes/assignment.routes.js`](../../server/src/routes/assignment.routes.js)
(routes `/`, `/me`, `/:assignmentId`).

## What was built

The join between a learner and a video lesson they've been given access to:

- `POST /api/assignments` — admin assigns a published video to a learner.
- `GET /api/assignments` — admin lists all assignments (optionally filtered
  by `?videoId=`).
- `GET /api/assignments/me` — learner lists their own assignments, each
  joined with its video and current progress.
- `DELETE /api/assignments/:assignmentId` — admin removes an assignment,
  cascading to its `Progress` and `Response` records.

## How it works

`Assignment` fields: `videoId` (ref), `learnerId` (ref `User`), `assignedBy`
(ref `User`, the admin who made the assignment). A **unique compound index**
on `{ videoId, learnerId }` means the same learner can't be assigned the same
video twice.

`POST /` validates two business rules beyond schema shape before creating the
row:
1. The target video must exist **and be published** — you cannot assign a
   draft.
2. The target user must exist **and have role `learner`** — you cannot
   "assign" content to an admin account.

`GET /me` is the learner-facing read model. It:
1. Finds the caller's assignments, populating `videoId` with a `match: {
   isPublished: true }` filter (so if a video was unpublished *after* being
   assigned, it silently disappears from the learner's list rather than
   erroring).
2. Drops any assignment where the populate didn't match (deleted or
   unpublished video).
3. Batch-loads `Progress` for the remaining assignments and joins it in
   memory by `assignmentId`, so the response is one flat list of
   `{ assignment, video, progress }` — everything the learner home page
   needs in a single request.

`DELETE /:assignmentId` cascades to `Progress` (one row, `deleteOne`) and
`Response` (many rows, `deleteMany`) so removing an assignment doesn't leave
orphaned progress/answer history behind.

## Why it works this way

- **Blocking assignment of unpublished videos at the API layer** (not just
  hiding the option in the UI): the admin UI already only lists published
  videos in the "assign" dropdown, but the server enforces it independently
  so the rule can't be bypassed by calling the API directly.
- **A unique `{videoId, learnerId}` index** rather than allowing multiple
  assignment rows for the same pair: an assignment *is* the relationship;
  duplicating it would fragment progress across two rows for what the
  learner experiences as "one lesson."
- **Silently filtering out unpublished/deleted videos in `GET /me`** rather
  than erroring or showing a broken entry: from the learner's point of view,
  a video that's been unpublished should just look like it was never
  assigned — there's nothing actionable they can do about it, so surfacing an
  error would be noise.
- **Cascading delete of `Progress`/`Response`**: an assignment is the parent
  of a learner's entire history on that video; removing the assignment (e.g.
  "this learner left the team") is meant to fully remove their record of it,
  consistent with how video deletion cascades to assignments (see
  [03-videos-feature.md](03-videos-feature.md)).

## Test cases

See [`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md):
assign an unpublished video (400), assign to a non-learner user id (400),
assign the same video+learner twice (409 via unique index), unpublish a
video after assigning it and confirm it drops out of `GET /me`, delete an
assignment and confirm its `Progress`/`Response` rows are gone but a
different assignment's rows survive.

## What further can be done

- **Bulk assignment** (assign a video to a cohort/group of learners in one
  call) instead of one API call per learner.
- **Due dates / mandatory vs. optional** assignments.
- **Reassignment on video-content change** — e.g. force a re-watch if
  questions changed materially after a learner completed it (ties into the
  "versioning" idea in [03-videos-feature.md](03-videos-feature.md)).
- **Self-enrollment** for a catalog of optional lessons, rather than 100%
  admin-driven assignment.

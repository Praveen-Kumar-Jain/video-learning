# Videos feature

Source: [`server/src/models/Video.js`](../../server/src/models/Video.js),
[`server/src/routes/video.routes.js`](../../server/src/routes/video.routes.js)
(routes `/`, `/:videoId`, `/:videoId/publish`).

## What was built

Full CRUD for the video-lesson catalog, plus a publish/unpublish toggle:

- `GET /api/videos` — role-aware list (see
  [02-authorization-and-roles.md](02-authorization-and-roles.md)).
- `POST /api/videos` — create (admin).
- `PATCH /api/videos/:videoId` — partial update (admin).
- `DELETE /api/videos/:videoId` — delete, **cascading** to its questions and
  assignments (admin).
- `PATCH /api/videos/:videoId/publish` — flip `isPublished` (admin).

## How it works

`Video` fields: `title`, `description`, `thumbnailUrl`, `videoUrl`,
`durationSeconds`, `isPublished`, `createdBy` (ref `User`).

Validation (`videoInput`, a Zod object) requires `title`, a valid URL for
`videoUrl`, and a positive number for `durationSeconds`; `description` and
`thumbnailUrl` are optional. `PATCH` uses `videoInput.partial()` so a client
can send just the fields it's changing.

**Deletion is cascading and explicit**, not left to a database-level
`ON DELETE CASCADE` (Mongo has no such thing) or a Mongoose middleware hook:

```js
const video = await Video.findByIdAndDelete(req.params.videoId);
if (!video) return res.status(404)...;
await Promise.all([
  Question.deleteMany({ videoId: video.id }),
  Assignment.deleteMany({ videoId: video.id }),
]);
```

Note this does **not** delete orphaned `Progress`/`Response` documents tied to
the deleted assignments — see "What further can be done" below.

**Publishing is a separate endpoint from update**, not a field you set via
`PATCH /:videoId`. `isPublished` gates two other things: (a) whether a
learner's `GET /api/videos` or `GET /api/videos/:videoId/questions` can see
it at all, and (b) whether it's assignable (`POST /api/assignments` rejects
assigning an unpublished video).

## Why it works this way

- **A dedicated publish endpoint** rather than folding `isPublished` into the
  general `videoInput` schema: publishing is a distinct workflow action ("make
  this live for learners") with its own guardrails, not just an edit. This also
  means the admin "Publish/Unpublish" button in the UI can fire a single-field
  mutation without needing to resend the whole video form.
- **Cascading question/assignment deletion at delete-time** rather than
  soft-deleting or blocking deletion when a video has assignments: for a
  learning-content admin tool, "delete" is expected to be a real cleanup
  action, and there's no requirement (yet) to preserve historical assignments
  for a video that no longer exists. This is called out explicitly in the
  admin UI's confirm dialog ("This also removes its questions and
  assignments") so it isn't a silent surprise.
- **URL-based `videoUrl` rather than file upload**: this was an explicit,
  discussed scope decision — see the top-level `docs/IMPLEMENTATION-SO-FAR.md`
  and "What further can be done" below.

## Test cases

See [`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md)
for the full matrix, including: create with invalid URL/negative duration
(400), unpublish a video that's currently assigned (allowed — it just becomes
invisible to the learner going forward), delete a video and confirm its
questions/assignments are gone but a *different* video's questions survive.

## What further can be done

- **Real file upload** (multer + local/object storage), with the platform
  computing duration server-side (e.g. via `ffprobe`) instead of trusting an
  admin-entered number — this was scoped out of the current pass but is the
  natural next step for "upload" to mean more than "paste a URL."
- **Cascade `Progress`/`Response` cleanup** on video deletion, or convert
  deletion to a soft-delete (`archivedAt`) so historical learner records
  remain queryable for compliance/reporting even after a lesson is retired.
- **Versioning**: today, editing a published video's questions retroactively
  changes what a learner who already completed it "answered" — there's no
  snapshot of the question set at assignment time.
- **Ownership scoping** (see [02-authorization-and-roles.md](02-authorization-and-roles.md)).

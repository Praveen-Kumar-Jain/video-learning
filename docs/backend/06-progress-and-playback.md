# Playback payload and progress tracking

Source: [`server/src/models/Progress.js`](../../server/src/models/Progress.js),
[`server/src/routes/assignment.routes.js`](../../server/src/routes/assignment.routes.js)
(routes `/:assignmentId/play`, `/:assignmentId/progress`).

## What was built

- `GET /api/assignments/:assignmentId/play` — everything the player needs in
  one call: the video, its questions (learner-safe shape), and saved
  progress.
- `PATCH /api/assignments/:assignmentId/progress` — upserts the learner's
  current playback position/percentage/status.

## How it works

`Progress` fields: `assignmentId` (ref, **unique** — one progress row per
assignment), `lastWatchedSecond`, `completionPercentage` (0-100),
`status` (`not_started` | `in_progress` | `completed`),
`answeredQuestionIds: [ObjectId]`.

`GET /:assignmentId/play`:
1. Resolves the assignment via the ownership-checked `learnerAssignment`
   helper (see [02-authorization-and-roles.md](02-authorization-and-roles.md)) —
   404 if it's not this learner's assignment.
2. Loads the video, its questions, and any existing progress **in parallel**
   (`Promise.all`).
3. 404s if the video isn't published (covers the same "unpublished after
   assignment" case as `GET /me` in
   [05-assignments-feature.md](05-assignments-feature.md)).
4. Maps questions down to the learner-safe shape (no answer key) — the exact
   same shielding as the standalone questions endpoint, applied inline here
   since this response has a different envelope.

`PATCH /:assignmentId/progress`:
- Validates the full triple `{ lastWatchedSecond, completionPercentage,
  status }` via Zod, then `findOneAndUpdate(..., { upsert: true })`.
- **There is no progress row until the first `PATCH`.** A brand-new
  assignment has `progress: null` in every read — the client (and the seed
  script) both treat "no progress document" as equivalent to `not_started`,
  rather than the server pre-creating an empty row at assignment time.

The player (client) drives this endpoint: it saves progress on pause, every
~5 seconds of playback, and on completion — see
[`docs/frontend/07-learner-player-page.md`](../frontend/07-learner-player-page.md).
The **server does not compute `completionPercentage` or `status` itself** —
it trusts whatever the authenticated client sends. This is a deliberate
scope tradeoff, discussed below.

## Why it works this way

- **Upsert instead of "create progress when an assignment is made"**:
  keeps assignment creation simple (a bare join row) and means "not started"
  is representable as *the absence of a row* rather than a row you have to
  remember to create with default values — one less write, one less place
  for the two to drift out of sync.
- **One combined `/play` endpoint** instead of three separate calls (video,
  questions, progress) from the client: the player screen needs all three
  atomically before it can render anything useful, so batching them into one
  round trip (with `Promise.all` on the server) is strictly better for
  perceived load time with no cost in flexibility, since nothing else needs
  video+questions+progress independently at that granularity.
- **Trusting client-reported progress** rather than deriving it purely from
  server-side event logs: this is the biggest intentional simplification in
  the whole progress system — see "What further can be done."

## Test cases

See [`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md):
`/play` for another learner's assignment (404), `/play` for a video that was
unpublished after assignment (404), first `PATCH .../progress` on a brand-new
assignment (creates the row), a second `PATCH` (updates in place, doesn't
duplicate), invalid `status` enum value (400), `completionPercentage` out of
`[0,100]` (400).

## What further can be done

- **Server-authoritative progress**: instead of the client asserting
  "I'm 42% through," the server could derive completion from which
  timestamp questions have been answered plus a heartbeat of `currentTime`,
  making it much harder for a learner to fake completion by calling the API
  directly. This is the single biggest trust gap in the current design and
  the most valuable next step if this needs to be tamper-resistant (e.g. for
  compliance training).
- **Watch-time analytics** (total active seconds watched, not just the
  furthest point reached) — useful for detecting "scrubbed to the end"
  versus "actually watched."
- **Idle/away detection** so a paused-and-forgotten tab doesn't count as
  progress.

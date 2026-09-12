# Learner: Home page ("My learning")

Source: [`client/src/pages/learner/HomePage.jsx`](../../client/src/pages/learner/HomePage.jsx).

## What was built

The learner's landing screen: a card per assigned, published lesson, showing
its current status and completion percentage, with a call-to-action button
that adapts to that status.

## How it works

One `useQuery(['assignments'], ...)` call to `GET /assignments/me`, which
already returns the joined `{ assignment, video, progress }` shape (see
[`docs/backend/05-assignments-feature.md`](../backend/05-assignments-feature.md)) —
this page does no additional data-stitching, just rendering.

For each entry:
- `percent = Math.round(progress?.completionPercentage || 0)` — defaults to
  `0` when `progress` is `null` (not-started; see
  [`docs/backend/06-progress-and-playback.md`](../backend/06-progress-and-playback.md)
  for why "no progress row" is the not-started representation).
- `completed = progress?.status === 'completed' || percent >= 100` — checks
  both the explicit status *and* the percentage, so a lesson that reached
  100% through any path reads as complete even if `status` were somehow out
  of sync.
- The button label/target adapts three ways: **"Start learning"** (no
  progress at all), **"Continue learning"** (progress exists, not complete),
  **"Review video"** (complete) — all linking to the same
  `/learn/:assignmentId` player route regardless of state, since the player
  itself handles resuming from the saved timestamp.

The whole list goes through `<Status>` for loading/error/empty states; the
empty-state message ("No published videos are assigned to you yet. Ask your
admin to publish and assign a lesson.") is written to be actionable for a
learner seeing a blank dashboard, not just a bare "no data" message.

## Why it works this way

- **No client-side derivation of status beyond what the server already
  computed**: `progress.status` and `progress.completionPercentage` are
  already authoritative fields from the API; the only client-side logic is
  reading them defensively (defaulting a missing `progress` to "not
  started") — see
  [`docs/backend/06-progress-and-playback.md`](../backend/06-progress-and-playback.md)
  for why the server itself doesn't pre-create a "not started" row.
- **One route (`/learn/:assignmentId`) for every state**, rather than a
  separate "review" route for completed lessons: the player already has to
  handle "resume from a saved timestamp" for in-progress lessons, and
  resuming from the end of a completed lesson is just a specific case of the
  same mechanism — no need for a second code path.
- **An actionable empty-state message**: a learner with no assignments has a
  specific next step (ask their admin), which the message states directly,
  rather than a generic "nothing here."

## Test cases

See [`docs/testing/05-e2e-learner-flow-test-plan.md`](../testing/05-e2e-learner-flow-test-plan.md):
log in as a learner with a not-started, an in-progress, and a completed
assignment (all three seeded for `learner@example.com` — see
[`docs/backend/11-api-docs-and-seed-data.md`](../backend/11-api-docs-and-seed-data.md))
and confirm each card's label/percentage/button text matches its actual
state; log in as a learner with zero assignments (`emma.rossi@example.com`)
and confirm the empty-state message renders.

## What further can be done

- **Sorting/filtering** (e.g. incomplete lessons first) once a learner has
  many assignments.
- **Due dates / required vs. optional** styling, once that concept exists
  server-side (see
  [`docs/backend/05-assignments-feature.md`](../backend/05-assignments-feature.md)).
- **Thumbnails** are already supported by the data model
  (`Video.thumbnailUrl`, populated by the seed data) but not yet rendered on
  this page's cards — a straightforward visual improvement.

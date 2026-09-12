# Admin: Assignments page

Source: [`client/src/pages/admin/AssignmentsPage.jsx`](../../client/src/pages/admin/AssignmentsPage.jsx).

## What was built

A screen to grant a learner access to a published lesson, list existing
assignments, and remove one.

## How it works

Three parallel `useQuery` calls feed the page: `admin-videos` (filtered
client-side to `isPublished` for the dropdown), `learners`
(`GET /users/learners`), and `admin-assignments` (`GET /assignments`, every
assignment across all learners/videos). The page's overall `loading`/`error`
state is the logical OR of all three, so the shared `<Status>` component
shows a single loading/error state rather than three independent spinners.

The assignment form is a plain uncontrolled `<form>` (two `<select>`s for
video and learner) submitted via `FormData` → `POST /assignments`. On
success, the form resets, a success message is shown, and the assignment
list is refetched. On failure (e.g. the server rejects an unpublished video
or a non-learner target — see
[`docs/backend/05-assignments-feature.md`](../backend/05-assignments-feature.md)),
the server's error message is shown inline instead of a generic failure.

The "Assign video" button is disabled whenever there are no published videos
or no learners to choose from, with an explicit hint ("Publish a video
first...") rather than a silently-empty, unusable dropdown.

The assignment list renders `assignment.videoId?.title` and
`assignment.learnerId?.name`/`.email` — both optional-chained because the
server populates them, but a video or learner **could** be deleted out from
under an assignment (deleting a video cascades to delete its own
assignments, but a user could in principle be removed by other means); the
fallback strings ("Deleted video"/"Deleted user") prevent a blank or
crashing row.

## Why it works this way

- **Filtering the published-video dropdown client-side**, given the API
  already returns every video to an admin: avoids a second, narrower API
  call just for this one dropdown, since the full video list is already
  being fetched and cached for this page's own use.
- **Optional-chaining + fallback labels for populated fields**: defensive
  against a data-consistency edge case that shouldn't normally happen (given
  cascading deletes), but costs nothing to guard against and avoids a
  crash if it ever does.
- **Explicit disabled-state hint text** instead of a silently unusable
  button: an admin opening this page for the very first time (before
  publishing anything) should be told *why* they can't assign yet, not left
  guessing why the button won't respond.

## Test cases

See [`docs/testing/04-e2e-admin-flow-test-plan.md`](../testing/04-e2e-admin-flow-test-plan.md):
assign a published video to a learner (succeeds, appears in the list),
attempt to assign the same pair twice (server rejects, error message shown),
remove an assignment (disappears from the list), open this page with zero
published videos (button disabled, hint shown), open it with zero learners
(button disabled).

## What further can be done

- **Bulk-assign to multiple learners at once** — see
  [`docs/backend/05-assignments-feature.md`](../backend/05-assignments-feature.md).
- **Search/filter** on the assignment list once it grows large.
- **Un-assign confirmation** (currently a single click removes an
  assignment with no confirm step, unlike video deletion).
- **Direct link from an assignment row to its Reports view** for that
  learner/video pair.

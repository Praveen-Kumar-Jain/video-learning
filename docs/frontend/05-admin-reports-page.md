# Admin: Reports page

Source: [`client/src/pages/admin/ReportsPage.jsx`](../../client/src/pages/admin/ReportsPage.jsx).

## What was built

A brand-new admin screen (the backend routes already existed but had no UI):
pick a lesson, see a per-learner progress table and a graded response table.

## How it works

A single `videoId` selection state drives two dependent queries:

```js
const progress = useQuery({ queryKey: ['report-progress', videoId], enabled: Boolean(videoId), ... });
const responses = useQuery({ queryKey: ['report-responses', videoId], enabled: Boolean(videoId), ... });
```

Both use React Query's `enabled` option so **no report request fires until a
lesson is selected** — the page shows a plain prompt ("Select a lesson...")
instead of an empty/loading table on first load. The `admin-videos` query
(shared cache key with the Videos page, so if that page is already loaded
it's instant) powers the lesson dropdown, including drafts (labeled
`(draft)`), since an admin may want to review a draft's question setup even
before publishing.

**Progress table**: one row per assignment, showing the learner's name/email,
a status pill (`not_started`/`in_progress`/`completed`, styled green when
completed), completion percentage, and last-watched second — a direct
render of the backend's already-joined response
(see [`docs/backend/08-reports-feature.md`](../backend/08-reports-feature.md)).

**Responses table**: one row per submitted answer, showing the learner, the
question (timestamp + prompt), their answer, the correct answer, and a
correct/incorrect badge. The header also shows a running `X/Y correct` tally
computed client-side (`responses.data.filter(r => r.isCorrect).length`) —
the only client-side computation on this page; everything else (which
answer maps to which option text, whether it's correct) is precomputed by
the server specifically so this page can stay presentation-only.

Both tables go through the shared `<Status>` component for their own
independent loading/error/empty states, so a lesson with progress rows but
zero submitted answers yet still shows a normal (not broken) "No answers
submitted yet" responses section.

## Why it works this way

- **`enabled: Boolean(videoId)`** rather than always fetching for an empty
  `videoId`: avoids a wasted/invalid request on initial render and makes the
  "nothing selected yet" state an explicit, deliberate UI state rather than
  an accidental loading spinner.
- **A single lesson selector driving two independent queries** instead of
  one combined endpoint: progress and responses are naturally two different
  tables with different shapes and different empty-state messaging: keeping
  them as two queries lets each show its own loading/empty state
  independently (e.g. progress could be ready while responses are still
  loading).
- **Zero client-side answer/correctness computation** beyond the aggregate
  tally: this was a deliberate split of responsibility with the backend
  (see [`docs/backend/08-reports-feature.md`](../backend/08-reports-feature.md)) —
  the client never resolves an option `_id` to text or re-implements
  grading, so there's exactly one place (`gradeResponse` +
  `report.routes.js`) that can disagree with itself.
- **Table-first UI, no charts**: matches the rest of the admin console's
  visual language (see
  [09-styling-and-design-system.md](09-styling-and-design-system.md)) and
  was the fastest path to something genuinely usable for the amount of data
  a single lesson typically has; see
  [10-future-work.md](10-future-work.md) for visual-summary ideas.

## Test cases

See [`docs/testing/04-e2e-admin-flow-test-plan.md`](../testing/04-e2e-admin-flow-test-plan.md):
open Reports with no lesson selected (prompt shown, no requests fired),
select a published lesson with seeded data and confirm the progress rows and
graded response rows match what the seed script produced (see
[`docs/backend/11-api-docs-and-seed-data.md`](../backend/11-api-docs-and-seed-data.md)),
select the draft lesson (still selectable, shows its own — likely
empty — progress/response state), select a lesson with assignments but no
submitted answers yet (progress table populated, responses table shows the
empty-state message).

## What further can be done

- **Charts/visual summaries** (completion funnel, score distribution) as an
  alternative or complement to the raw tables — see
  [`docs/backend/08-reports-feature.md`](../backend/08-reports-feature.md).
- **CSV export** of either table.
- **Per-learner drill-down** across all of their assigned lessons, not just
  one lesson at a time.
- **Sorting/filtering** the responses table (e.g. "show only incorrect
  answers") once a lesson has enough data for that to matter.

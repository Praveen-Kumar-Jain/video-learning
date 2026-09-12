# Reports feature

Source: [`server/src/routes/report.routes.js`](../../server/src/routes/report.routes.js).

## What was built

Two admin-only, per-video reports:

- `GET /api/reports/videos/:videoId/progress` — every learner assigned to
  this video, their status, completion %, and last-watched second.
- `GET /api/reports/videos/:videoId/responses` — every submitted answer for
  this video, enriched with the learner's readable answer, the correct
  answer, and a computed `isCorrect` flag.

This was the other major gap the original implementation had: the routes
existed, but the admin UI never called them, and the responses endpoint
returned raw answer IDs with no grading — unusable as an actual report. This
pass rebuilt the responses endpoint's output shape and added the admin UI
(see [`docs/frontend/05-admin-reports-page.md`](../frontend/05-admin-reports-page.md)).

## How it works

Both routes are mounted behind `router.use(requireAuth, requireRole('admin'))`
at the top of the file, so every route in this file is admin-only by
construction — there's no route in `report.routes.js` that could be
accidentally left unprotected.

**Progress report**: loads all `Assignment`s for the video (populating the
learner's name/email), batch-loads their `Progress` rows, and joins in
memory. An assignment with no `Progress` row is reported as a synthetic
`{ status: 'not_started', completionPercentage: 0, lastWatchedSecond: 0 }` —
the same "no row = not started" convention used everywhere else (see
[06-progress-and-playback.md](06-progress-and-playback.md)).

**Responses report**: loads all `Response`s for the video's assignments,
`.populate('questionId')` (the *full* question document, including the
answer key — safe here because this route is admin-only), and for each
response computes:

```js
{
  learner,                                   // { name, email }
  question: { id, prompt, timestampSeconds, type },
  learnerAnswerLabel: answerLabel(question, response.answer),
  correctAnswerLabel: question.type === 'short'
    ? question.acceptedAnswers.join(', ')
    : optionLabels(question, question.correctOptionIds).join(', '),
  isCorrect: gradeResponse(question, response.answer),
  submittedAt: response.createdAt,
}
```

`optionLabels`/`answerLabel` resolve option `_id`s to their human-readable
`text` server-side, so the client never has to cross-reference a separate
options list to render "what did they answer."

## Why it works this way

- **`router.use(requireAuth, requireRole('admin'))` at the top of the file**
  instead of repeating the pair on every route: this file has exactly one
  audience (admins), so a single blanket guard is both less repetitive and
  structurally impossible to forget on a new route added later.
- **Resolving answer/option labels server-side** rather than shipping raw
  IDs and the question's option list separately: keeps the admin UI table
  purely presentational (see
  [`docs/frontend/05-admin-reports-page.md`](../frontend/05-admin-reports-page.md)) —
  it just renders strings it's given, with no ID-matching logic duplicated
  on the client.
- **Reusing `gradeResponse`** (see
  [07-responses-and-grading.md](07-responses-and-grading.md)) instead of a
  second, report-specific correctness check: one grading definition, used
  everywhere correctness is needed, tested once.
- **Filtering out responses whose `questionId` failed to populate**
  (`.filter((response) => response.questionId)`): if a question is deleted
  after being answered, the orphaned response is silently dropped from the
  report rather than crashing on `question.prompt` of `null`.

## Test cases

See [`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md):
a learner calling either report route (403), a video with assignments but no
progress/responses yet (empty-but-valid arrays, not an error), a response
whose question was since deleted (dropped from the responses report, doesn't
500), correctness flags matching hand-computed expectations for a mix of
single/multiple/short questions.

## What further can be done

- **CSV/Excel export** of either report.
- **Cross-video aggregate reports** ("this learner's overall completion
  across every assigned lesson") — today reports are strictly per-video.
- **Charts/visual summaries** (completion funnel, score distribution) instead
  of raw tables — the current admin UI is intentionally table-first (see
  [`docs/frontend/05-admin-reports-page.md`](../frontend/05-admin-reports-page.md)).
- **Pagination** once a video has enough assignments/responses that a single
  unpaginated table becomes unwieldy.
- **Time-series progress** (a completion trend over time) rather than only a
  current snapshot.

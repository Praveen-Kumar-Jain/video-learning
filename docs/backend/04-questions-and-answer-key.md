# Questions and the answer key

Source: [`server/src/models/Question.js`](../../server/src/models/Question.js),
[`server/src/utils/questionOptions.js`](../../server/src/utils/questionOptions.js),
[`server/src/routes/video.routes.js`](../../server/src/routes/video.routes.js)
(routes `/:videoId/questions`, `/questions/:questionId`).

## What was built

Timestamp questions attached to a video, of three types (`single`,
`multiple`, `short`), each with a real, admin-editable **answer key**:

- `GET /api/videos/:videoId/questions` — list, answer key stripped for
  learners.
- `POST /api/videos/:videoId/questions` — create, with `options:
  [{ text, isCorrect }]` for choice questions or `acceptedAnswers: [string]`
  for short answer.
- `PATCH /api/videos/questions/:questionId` — update, same shape.
- `DELETE /api/videos/questions/:questionId` — delete.

This was a gap in the original implementation: the routes existed, but
nothing in the request shape let an admin mark which option was correct, so
`correctOptionIds`/`acceptedAnswers` were always empty outside of the seed
script. This pass closed that gap end-to-end (API + UI).

## How it works

**Schema** (`Question`): `videoId` (ref), `timestampSeconds`, `type`,
`prompt`, `options: [{ text }]` (each option auto-gets a Mongo `_id`),
`correctOptionIds: [ObjectId]`, `acceptedAnswers: [String]`. A **unique
compound index** on `{ videoId, timestampSeconds }` means two questions can
never be scheduled for the exact same pause point in the same video.

**The `isCorrect` problem.** The client wants to send "option 2 and option 3
are correct" in the same request that creates the options — but Mongo option
subdocuments only get an `_id` once they exist as part of a document, so you
can't know an option's `_id` before it's attached. `applyOptions` (server/src/utils/questionOptions.js)
solves this in one place, used by both the create and update routes (and the
seed script):

```js
export function applyOptions(question, optionInputs) {
  question.options = optionInputs.map(({ text }) => ({ text })); // assigns fresh _ids
  question.correctOptionIds = question.options
    .filter((_, index) => optionInputs[index].isCorrect)
    .map((option) => option._id);
}
```

Because assigning a plain array to a Mongoose `DocumentArray` path casts each
element into a subdocument (generating its `_id`) synchronously, `applyOptions`
can read `option._id` immediately after the assignment, before the document
is even saved. **Persisted `options` never store `isCorrect`** — it's a
request/response-shape convenience, not a schema field. The single source of
truth for correctness is `correctOptionIds`.

**Validation rules**, enforced in the route handler (`questionRuleViolation`),
beyond basic Zod shape checking:
- The question's `timestampSeconds` must be strictly less than the video's
  `durationSeconds`.
- Choice questions (`single`/`multiple`) need at least 2 options and at
  least 1 marked correct.
- Short-answer questions need at least 1 accepted answer.

**Answer-key stripping for learners** happens in the `GET .../questions`
handler:

```js
const { correctOptionIds, acceptedAnswers, ...safeQuestion } = question.toObject();
```

Admins get the full document (including the answer key), which is what
powers the "edit question" flow pre-checking the currently-correct option(s).

## Why it works this way

- **A single shared `applyOptions` helper** instead of duplicating the
  "derive `correctOptionIds` from flags" logic in the create route, the
  update route, and the seed script separately: this logic has a subtle
  correctness requirement (assign options *before* reading their `_id`s), and
  a shared helper means that requirement only has to be gotten right once.
- **`isCorrect` as a transient request field, not a stored one**: keeps the
  persisted schema minimal (an option is just its text) and keeps
  `correctOptionIds` as the unambiguous, order-independent source of truth
  used by grading — see [07-responses-and-grading.md](07-responses-and-grading.md).
- **A unique `{videoId, timestampSeconds}` index** rather than allowing
  duplicate timestamps: two questions at the same second would create an
  undefined "which one shows first" race in the player, so it's rejected at
  the data layer, not just in the UI.
- **Stripping the answer key server-side** rather than trusting the client
  not to render it: the same "never trust the client" reasoning as in
  [02-authorization-and-roles.md](02-authorization-and-roles.md).

## Test cases

See [`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md):
create/edit with 0 or 1 correct options marked (rejected for choice types),
short-answer with no accepted answers (rejected), timestamp ≥ video duration
(rejected), duplicate timestamp on the same video (rejected via unique index
→ surfaced as `409` by the shared error handler), editing an existing
question's options and confirming `correctOptionIds` is recomputed against the
*new* option `_id`s (not stale ones), and confirming a learner's `GET
.../questions` response never contains `correctOptionIds`/`acceptedAnswers`.

## What further can be done

- **Partial-credit or weighted scoring** for multi-select questions (today
  it's all-or-nothing — see [07-responses-and-grading.md](07-responses-and-grading.md)).
- **Rich text / media in prompts** (currently plain text only).
- **Reordering options** with explicit drag-and-drop rather than array order.
- **A visual timeline picker** in the admin UI for setting `timestampSeconds`
  against the actual video scrubber, instead of typing a number.
- **Question reuse across videos** (a question bank), instead of every
  question belonging to exactly one video.

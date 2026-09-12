# Responses and grading

Source: [`server/src/models/Response.js`](../../server/src/models/Response.js),
[`server/src/utils/grading.js`](../../server/src/utils/grading.js),
[`server/src/routes/assignment.routes.js`](../../server/src/routes/assignment.routes.js)
(route `/:assignmentId/responses`).

## What was built

- `POST /api/assignments/:assignmentId/responses` — a learner submits an
  answer to a timestamp question.
- `gradeResponse(question, answer)` — a pure function that says whether a
  submitted answer is correct, used by the reports feature (not by this
  route itself — see "Why" below).

## How it works

`Response` fields: `assignmentId` (ref), `questionId` (ref), `answer`
(`Mixed` — a string for `single`/`short`, an array of strings for
`multiple`). A **unique compound index** on `{ assignmentId, questionId }`
means a learner has at most one recorded answer per question per assignment.

`POST /:assignmentId/responses`:
1. Resolves the assignment via the ownership-checked helper (404 if not
   theirs).
2. Confirms the question actually belongs to this assignment's video (400 if
   not — prevents answering a question that isn't even part of the lesson
   being played).
3. **Upserts** the `Response` on `{ assignmentId, questionId }` — resubmitting
   an answer to the same question overwrites the previous one rather than
   erroring or duplicating (consistent with the unique index).
4. Adds the question to `Progress.answeredQuestionIds` via `$addToSet`
   (idempotent — safe to call twice) and upserts a `Progress` row if none
   exists yet.

`gradeResponse` (`server/src/utils/grading.js`):

```js
export function gradeResponse(question, answer) {
  if (question.type === 'short') {
    const submitted = normalize(answer); // trim + lowercase
    return question.acceptedAnswers.some((accepted) => normalize(accepted) === submitted);
  }
  const submittedIds = (Array.isArray(answer) ? answer : [answer]).map(String).sort();
  const correctIds = question.correctOptionIds.map(String).sort();
  return submittedIds.length === correctIds.length && submittedIds.every((id, i) => id === correctIds[i]);
}
```

- Short answers are graded by case-insensitive, whitespace-trimmed exact
  match against any of the question's `acceptedAnswers`.
- Choice answers are graded as **exact set equality** against
  `correctOptionIds` — both sides are sorted before comparing, so submission
  order never matters (`['b','a']` matches `['a','b']`), and a partial subset
  or a superset with one extra wrong option is graded fully incorrect (no
  partial credit).

This function is **not called from the submission route**. Grading is
computed only when an admin views the responses report
(`report.routes.js`) — see [08-reports-feature.md](08-reports-feature.md).

## Why it works this way

- **Grading is a pure function, decoupled from persistence**: `gradeResponse`
  takes plain data in, returns a boolean, and touches no database — which is
  exactly why it has a dedicated unit test suite
  (`server/test/grading.test.js`) with zero database setup. It's also why the
  same function can be reused anywhere correctness needs to be computed
  (today: reports; tomorrow: maybe pass/fail gating).
- **Grading at *read* time (reports), not at *write* time (submission)**:
  the raw answer is the source of truth; correctness is a derived view over
  it. This means changing a question's answer key after the fact
  automatically re-grades every existing response the next time a report is
  viewed — no backfill migration needed, no risk of stale "was correct at the
  time" flags drifting from the current answer key.
- **Upsert-on-resubmit** rather than rejecting a second answer: matches the
  player's "quick check" UX, where a learner who navigates back to an
  earlier point in the video and re-answers should have their latest answer
  count, not their first.
- **Set-equality grading for multi-select, no partial credit**: the simplest
  correct definition of "did you pick exactly the right options," and it's
  what the seeded demo data assumes (see
  [11-api-docs-and-seed-data.md](11-api-docs-and-seed-data.md)). Partial
  credit is a legitimate future feature but adds a scoring-model decision
  (fractional score? some-but-not-all correct = wrong?) that wasn't in scope.

## Test cases

`server/test/grading.test.js` covers: single-choice right/wrong option,
multiple-choice with correct options submitted out of order (correct),
multiple-choice missing one correct option (wrong), multiple-choice with an
extra wrong option added (wrong), short answer with mixed case and
surrounding whitespace (correct), short answer not in the accepted list
(wrong).

See [`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md)
for the route-level cases: submitting for a question that belongs to a
different video (400), submitting twice to the same question (second
overwrites, `answeredQuestionIds` still has exactly one entry, not two),
submitting an array answer to a `single` question and vice versa (grading
still resolves correctly rather than crashing, because `gradeResponse`
normalizes both sides to arrays before comparing).

## What further can be done

- **Grade at submission time too**, returning `{ isCorrect }` in the `POST
  .../responses` response — currently intentionally withheld from the
  learner (see [08-reports-feature.md](08-reports-feature.md) for why), but
  the server-side capability already exists if that product decision
  changes.
- **Partial credit** for multi-select (e.g. score = correct picks minus
  incorrect picks, floored at 0).
- **Fuzzy short-answer matching** (Levenshtein distance / synonyms) instead
  of exact string match against a fixed list — today an admin must
  anticipate every acceptable phrasing.
- **A visible score summary** per learner per lesson (e.g. "3/4 correct"),
  aggregating `gradeResponse` across all of a lesson's questions.

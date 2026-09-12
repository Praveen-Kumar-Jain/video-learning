# Admin: Questions page

Source: [`client/src/pages/admin/QuestionsPage.jsx`](../../client/src/pages/admin/QuestionsPage.jsx).

## What was built

This page went from "create a question with no way to mark a correct
answer" to a full create/edit/delete workflow with an actual answer-key
editor: per-option "this is correct" checkboxes/radios for single/multiple
choice, and a line-per-answer list for short answer.

## How it works

**Form state shape.** Unlike the Videos page's simple `defaultValue` form,
this form is fully controlled (`form` state object), because option rows are
dynamic (add/remove) and need live checkbox state:

```js
{ id, timestampSeconds, type, prompt, options: [{ key, text, isCorrect }], acceptedAnswers }
```

- `blankForm()` seeds a new question with 2 empty option rows (the server's
  minimum for choice types).
- `formFromQuestion(question)` rebuilds this shape from an existing question
  for editing: it reads `question.correctOptionIds` (only present because
  this is the admin-facing question list — see
  [`docs/backend/04-questions-and-answer-key.md`](../backend/04-questions-and-answer-key.md))
  into a `Set`, then marks each existing option's `isCorrect` by checking
  membership, so **the previously-correct answer(s) are pre-checked** when
  you open a question to edit it.

**Single vs. multiple choice input semantics.** For `type === 'multiple'`,
each option's checkbox toggles that option's `isCorrect` independently
(`updateOption`). For `type === 'single'`, checking one option
(`setSingleCorrectOption`) sets every *other* option's `isCorrect` to
`false` — the UI enforces "exactly one correct answer" for single-choice
before the request is even sent, matching the server's validation.

**Option rows** are add/removable (`addOption`/`removeOption`), with removal
disabled once only 2 remain (the server's minimum). Each row gets a locally
generated `key` (`emptyOption()` uses an incrementing counter for new rows;
existing rows reuse the real option `_id`) purely for React's `key` prop —
these keys are **not** sent to the server.

**Submission** builds the request payload from `form` state:

```js
{
  timestampSeconds: Number(form.timestampSeconds),
  type: form.type,
  prompt: form.prompt,
  options: form.type === 'short' ? [] : form.options.filter(o => o.text.trim()).map(o => ({ text: o.text.trim(), isCorrect: o.isCorrect })),
  acceptedAnswers: form.type === 'short' ? form.acceptedAnswers.split('\n').map(l => l.trim()).filter(Boolean) : [],
}
```

This is exactly the `{ text, isCorrect }` shape the server's
`applyOptions` helper expects (see
[`docs/backend/04-questions-and-answer-key.md`](../backend/04-questions-and-answer-key.md)) —
the client never has to know or care about option `_id`s when creating a
question; the server derives `correctOptionIds` itself.

**Save** (one `useMutation`) branches on `form.id` to decide `POST
.../questions` vs. `PATCH .../questions/:id`, mirroring the Videos page's
create/edit pattern. Server-side validation failures (e.g. "Choice questions
need at least one correct option") surface via `formError`, read from
`error.response?.data?.message`.

## Why it works this way

- **A fully controlled form with dynamic option rows**, unlike the simpler
  uncontrolled `defaultValue` forms elsewhere in the app: option rows can be
  added/removed and their correctness toggled live, which requires the form
  to be able to re-render based on state — an uncontrolled form has no way
  to represent "add a 5th option row."
- **Client-side "exactly one correct" enforcement for single-choice** (via
  `setSingleCorrectOption` clearing every other option): gives immediate
  visual feedback consistent with the question type, rather than letting an
  admin check two radios' worth of options and only discovering the mismatch
  from a server error after submitting.
- **Sending `{ text, isCorrect }` and letting the server derive
  `correctOptionIds`** rather than the client tracking option `_id`s itself:
  this was a deliberate API design choice (see
  [`docs/backend/04-questions-and-answer-key.md`](../backend/04-questions-and-answer-key.md))
  specifically so the client never needs a "create, then look up the
  returned option IDs, then PATCH the correct ones" two-step flow — the
  whole thing is one request.
- **Reusing the exact same form/state shape for create and edit**
  (`formFromQuestion` maps a persisted question back into the same shape
  `blankForm` produces): means there is exactly one rendering path for the
  form, whether creating or editing, cutting the risk of the two drifting
  apart.

## Test cases

See [`docs/testing/04-e2e-admin-flow-test-plan.md`](../testing/04-e2e-admin-flow-test-plan.md):
create a single-choice question and check one option correct (only one radio
can be checked at a time), create a multiple-choice question with 2+ options
checked, create a short-answer question with 2+ accepted answers on separate
lines, attempt to submit a choice question with no option checked (rejected,
server error surfaces), edit an existing seeded question and confirm the
correct option(s) show pre-checked, remove an option row down to the 2-row
minimum and confirm the remove button disables, delete a question and
confirm it disappears from the list.

## What further can be done

- **Reordering options** via drag-and-drop instead of only add/remove at the
  end.
- **A visual timestamp picker** tied to a video preview/scrubber, instead of
  a bare number input (see
  [`docs/backend/04-questions-and-answer-key.md`](../backend/04-questions-and-answer-key.md)).
- **Inline duplicate-timestamp feedback** before submitting, rather than
  relying on the server's unique-index conflict (`409`) surfacing after the
  fact.
- **Autosave/draft recovery** for long question-authoring sessions.

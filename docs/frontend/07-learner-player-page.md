# Learner: Player page

Source: [`client/src/pages/learner/PlayerPage.jsx`](../../client/src/pages/learner/PlayerPage.jsx).

## What was built

The actual lesson-watching experience: an HTML5 `<video>` element that
pauses at each unanswered timestamp question, shows a quiz modal, saves the
answer, and resumes — while persisting playback progress so a learner can
leave and come back.

## How it works

**Two components, one guard.** `PlayerPage` fetches
`GET /assignments/:id/play` (video + learner-safe questions + progress —
see [`docs/backend/06-progress-and-playback.md`](../backend/06-progress-and-playback.md))
and shows `<Status>` while loading/erroring. Only once `query.data` exists
does it render `PlayerExperience`, a second component that receives the
resolved `data` as a prop. This split exists because `PlayerExperience` uses
several hooks (`useRef`, `useState` seeded from `data.progress`) that assume
`data` is already present — conditionally calling those hooks inside
`PlayerPage` itself would violate the Rules of Hooks, so the "wait for data"
branch has to happen in a parent that renders a *different* child, not a
conditional return in the middle of the same component's hook calls.

**Resuming.** On mount, `useEffect` sets `player.current.currentTime =
progress.lastWatchedSecond` once the video element exists — this is what
makes "leave at 22s, come back later, land back near 22s" work.

**Pausing for a question.** `onTimeUpdate` (fired continuously by the
`<video>` element during playback) checks:

```js
const next = questions.find((item) => !handled.has(String(item.id)) && currentTime >= item.timestampSeconds);
if (next && !question) {
  player.current.pause();
  setQuestion(next);
  ...
}
```

`handled` is a `Set` of already-answered question IDs, seeded from
`progress.answeredQuestionIds` on mount and grown every time an answer is
saved — this is what makes "refresh after answering, that question doesn't
reappear" work, since it's checked purely from local state seeded from the
server's own record, not re-derived from playback position alone.

**Progress persistence.** The same `onTimeUpdate` handler also throttles
progress saves to roughly every 5 seconds of playback
(`currentTime - lastSavedSecond.current >= 5`) via `persist(currentTime)`,
which computes `completionPercentage` client-side
(`Math.min(99, Math.round((currentTime / duration) * 100))` — capped at 99
so only an actual `onEnded` event can claim 100%) and `PATCH`es progress.
Pausing the video (`onPause`) also persists immediately (unless a question
modal is already open, or the video is essentially at its end, or it's
already marked complete) so a manual pause doesn't lose up to 5 seconds of
unsaved progress. Finishing the video (`onEnded`) persists
`{ completionPercentage: 100, status: 'completed' }` unconditionally.

**Answer submission.** The quiz modal renders differently per
`question.type`: a `<textarea>` for `short`, radio inputs for `single`,
checkboxes for `multiple` (read via `querySelectorAll('input:checked')` at
submit time rather than individually-controlled state, since multi-select
doesn't need per-checkbox state, only the final set at submit). On success,
the answered question is added to `handled`, the modal closes, and playback
resumes (`player.current.play()`), with a inline error notice if autoplay is
blocked by the browser (the learner just has to press play manually in that
case).

## Why it works this way

- **Splitting into `PlayerPage` (data-fetching) and `PlayerExperience`
  (everything else)** rather than one component with an early
  `if (loading) return ...` in the middle: keeps every hook in
  `PlayerExperience` unconditionally called on every render, which is a
  hard requirement of React's Rules of Hooks once the component's logic
  depends on hooks seeded from data that might not exist yet.
- **A local `handled` `Set`, not "check timestamp against progress on every
  render"**: answered-ness needs to persist correctly through the *current*
  session immediately after answering (before a refetch would even happen),
  and also needs to reflect what the server already knew on load — seeding
  the set from `progress.answeredQuestionIds` and then growing it locally on
  each successful answer satisfies both without an extra round-trip per
  answer.
- **Throttled (~5s) autosave plus explicit save-on-pause and
  save-on-complete**, rather than saving on every `timeupdate` tick: saving
  on every tick (which can fire many times per second) would flood the API
  with redundant writes; 5-second granularity is a reasonable balance
  between "don't lose much progress on an unexpected tab close" and "don't
  spam the network."
- **Capping client-computed percentage at 99 until `onEnded` fires**:
  guarantees "100%/completed" can only ever be set by actually finishing
  playback, not by an off-by-one rounding error in the periodic autosave
  claiming completion prematurely.
- **Reading multi-select answers via `querySelectorAll` at submit time**
  instead of one controlled-state entry per checkbox: for a modal that's
  fully torn down and rebuilt per question, uncontrolled checkboxes plus a
  single read-at-submit-time step is simpler than provisioning
  N pieces of state for an N that varies per question.

## Test cases

See [`docs/testing/05-e2e-learner-flow-test-plan.md`](../testing/05-e2e-learner-flow-test-plan.md)
for the full manual walkthrough (this is the hardest part of the app to
cover with the current shallow automated test suite — see
[`docs/testing/00-test-strategy-and-tooling.md`](../testing/00-test-strategy-and-tooling.md)):
resuming at a saved timestamp, pausing at each question type
(single/multiple/short) and confirming the right input renders, submitting
an empty short answer (blocked client-side), submitting a multiple-choice
answer with zero boxes checked (blocked client-side), refreshing mid-lesson
and confirming answered questions don't re-trigger, reaching the end and
confirming the completion badge appears and the home page reflects 100%.

## What further can be done

- **Server-authoritative completion**, since today a learner who can call
  the API directly could `PATCH` `completionPercentage: 100` without ever
  watching the video — see
  [`docs/backend/06-progress-and-playback.md`](../backend/06-progress-and-playback.md).
- **Seek/scrub prevention** (or at least detection) past an unanswered
  question — today, if a learner manually drags the scrubber past a
  question's timestamp, `onTimeUpdate` still catches it and pauses, but a
  fast/coarse scrub could theoretically skip the exact tick where the check
  runs (an edge case worth a dedicated test — see
  [`docs/testing/06-edge-cases-and-negative-scenarios.md`](../testing/06-edge-cases-and-negative-scenarios.md)).
- **Immediate right/wrong feedback** — intentionally not built (see
  [`docs/backend/07-responses-and-grading.md`](../backend/07-responses-and-grading.md))
  but the data is already there if the product direction changes.
- **Keyboard/accessibility pass** on the quiz modal (it has `role="dialog"`/
  `aria-modal` today, but no focus trap or escape-to-close).

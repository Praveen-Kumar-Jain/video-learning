# Edge cases and negative scenarios

Cross-cutting cases that don't belong to a single flow — mostly about what
happens when data changes underneath a user, or when input is adversarial/
malformed rather than simply "wrong."

## Data lifecycle races

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Admin unpublishes a video while a learner has it open in the player | The learner's current tab keeps playing (data already loaded); their **next** progress save or refresh hits a video-unavailable state, not a silent success |
| 2 | Admin deletes a video while a learner has an active assignment for it | Learner's next `GET /assignments/me` or `/play` call returns without that assignment / a 404 respectively — see [`docs/backend/05-assignments-feature.md`](../backend/05-assignments-feature.md) |
| 3 | Admin deletes an assignment while the learner is mid-playback | Learner's next progress `PATCH`/response `POST` returns `404 Assignment not found` |
| 4 | Admin edits a question's correct answer after a learner already answered it | The learner's stored `Response.answer` is untouched; the next time an admin views Reports, `isCorrect` is recomputed against the **new** answer key (grading happens at read time — see [`docs/backend/07-responses-and-grading.md`](../backend/07-responses-and-grading.md)), so a previously-"correct" answer can retroactively show as incorrect |
| 5 | Admin deletes a question after a learner answered it | That response is dropped from the Reports responses table (filtered out server-side) rather than causing a crash |
| 6 | Two admins edit the same video/question concurrently | Last write wins (no optimistic-locking/conflict detection exists) — acceptable for the current single-admin-team scale, worth revisiting if concurrent editing becomes common |

## Input edge cases

| # | Scenario | Expected |
| --- | --- | --- |
| 7 | Question `timestampSeconds` exactly equal to `video.durationSeconds` | Rejected (`>=` check, not `>`) — the boundary itself is invalid, not just values beyond it |
| 8 | Question `timestampSeconds: 0` | Accepted (`min(0)` in the schema) — a question can legitimately be asked immediately |
| 9 | Extremely long `prompt` (over 1000 chars) | Rejected by Zod's `max(1000)` |
| 10 | `title` over 160 chars | Rejected by Zod's `max(160)` |
| 11 | Multiple-choice `answer` submitted as a single string instead of an array | Accepted by the schema's `z.union`; `gradeResponse` still compares correctly since it normalizes non-array answers into a one-element array before comparing |
| 12 | Short-answer `acceptedAnswers` containing only whitespace strings | Not explicitly rejected — an admin could enter a whitespace-only "accepted answer," which would never match any trimmed learner input; worth a stricter validation rule in the future (trim-then-`min(1)` on each entry) |
| 13 | Assignment created, then the learner is deleted from `User` (not through normal app flow, e.g. direct DB edit) | Reports/`GET /assignments` gracefully render "Deleted user" via optional-chained frontend fallbacks; no crash |
| 14 | A video's `thumbnailUrl` is an empty string vs. omitted entirely | Both accepted (`z.string().url().or(z.literal(''))`) |

## Authorization edge cases

| # | Scenario | Expected |
| --- | --- | --- |
| 15 | A learner passes another learner's valid assignment ID to `/play`, `/progress`, or `/responses` | `404`, not `403` — see [`docs/backend/02-authorization-and-roles.md`](../backend/02-authorization-and-roles.md) for why this matters (no enumeration signal) |
| 16 | A request with a well-formed but tampered JWT (wrong signature) | `401 Invalid or expired access token` |
| 17 | A request with a JWT signed correctly but for a role the token doesn't actually have server-side (i.e., role in token payload is stale after a manual DB role change) | `requireAuth` re-fetches the user from the DB every request, so the **current** DB role is what's enforced, not the token's embedded role — a role downgrade takes effect immediately, not after 8 hours |
| 18 | An admin-only route called with a valid learner token | `403`, not `401` (the token is valid; the role just isn't permitted) |

## Frontend robustness

| # | Scenario | Expected |
| --- | --- | --- |
| 19 | API is unreachable (server down) when a page loads | `<Status error>` renders a generic failure message rather than an unhandled exception/blank screen |
| 20 | A mutation fails (e.g. network drop mid-submit) | The relevant page shows an inline error (each page's own `mutation.error` handling — see the individual `docs/frontend/*` page docs) rather than silently doing nothing |
| 21 | Browser back/forward navigation between admin sub-pages | React Router's client-side navigation keeps auth/layout state intact; no full page reload required |
| 22 | Very narrow (mobile-width) viewport on any page | Layout collapses to single-column per the one defined breakpoint; no horizontal scroll/overflow — see [`docs/frontend/09-styling-and-design-system.md`](../frontend/09-styling-and-design-system.md) |

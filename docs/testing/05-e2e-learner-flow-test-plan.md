# E2E manual test plan: learner flows

Prerequisites: same as
[04-e2e-admin-flow-test-plan.md](04-e2e-admin-flow-test-plan.md). Sign in as
`learner@example.com` / `Password123!` unless a step says otherwise — this
account is seeded with one in-progress, one completed, and one
assigned-but-not-started course specifically so a single login exercises
every state (see
[`docs/backend/11-api-docs-and-seed-data.md`](../backend/11-api-docs-and-seed-data.md)).

## A. My learning (home page)

| # | Steps | Expected |
| --- | --- | --- |
| A1 | Log in and land on **My learning** | Three lesson cards: one `Not started` (0%), one `In progress` (partial %), one `Completed` (100%) |
| A2 | Check button labels on each card | "Start learning" on the not-started card, "Continue learning" on the in-progress card, "Review video" on the completed card |
| A3 | Log in as `emma.rossi@example.com` (no assignments) | Empty-state message: "No published videos are assigned to you yet. Ask your admin to publish and assign a lesson." |
| A4 | Log in as `mia.chen@example.com` (one fully completed, all-correct course) | Single card, `Completed`, 100% |

## B. Player: resuming and basic playback

| # | Steps | Expected |
| --- | --- | --- |
| B1 | From the in-progress card, click **Continue learning** | Player loads; video's `currentTime` jumps to the previously saved timestamp shortly after load |
| B2 | From the not-started card, click **Start learning** | Player loads at `0`; no premature "completed" badge |
| B3 | From the completed card, click **Review video** | Player loads; a "Completed - 100%" badge is visible in the header |
| B4 | Let the video play past a question's timestamp that was already answered | Playback does **not** pause at that timestamp (it's in `answeredQuestionIds`) |

## C. Player: answering questions

| # | Steps | Expected |
| --- | --- | --- |
| C1 | Let playback reach an unanswered `single`-choice question's timestamp | Video pauses; modal shows the prompt and radio-button options |
| C2 | Select an option, submit | Modal closes; a "Answer saved. Playback resumed." notice appears; video resumes playing |
| C3 | Let playback reach an unanswered `multiple`-choice question | Modal shows checkboxes |
| C4 | Submit with zero boxes checked | Submission blocked client-side (no request sent, modal stays open) |
| C5 | Check 2+ boxes, submit | Accepted, playback resumes |
| C6 | Let playback reach an unanswered `short`-answer question | Modal shows a text area |
| C7 | Submit with an empty text area | Browser-native required-field validation blocks submission |
| C8 | Enter any non-empty text, submit | Accepted, playback resumes |
| C9 | Refresh the page immediately after answering a question | That question does not reappear when playback reaches its timestamp again |
| C10 | Re-open a lesson and manually seek backward past an already-answered question's timestamp, then forward again | Question does not reappear (answered-state is tracked by question id, not by timestamp position) |

## D. Player: progress persistence

| # | Steps | Expected |
| --- | --- | --- |
| D1 | Watch ~10+ seconds, then pause | A progress save fires (observable via network tab: `PATCH .../progress`) |
| D2 | Refresh the page after D1 | Player resumes at approximately the paused timestamp |
| D3 | Let a video play uninterrupted for 10+ seconds without pausing | At least one autosave fires (~every 5s of playback) |
| D4 | Let a video play to the very end | `onEnded` fires; a final `PATCH` sets `completionPercentage: 100, status: 'completed'`; a completion notice appears |
| D5 | Return to **My learning** after D4 | That lesson's card now shows `Completed`, 100% |
| D6 | Pause a video that is already marked completed (via "Review video") | No further progress `PATCH` fires (already-completed lessons don't get overwritten by a lower in-progress percentage) |

## E. Player: error and edge conditions

| # | Steps | Expected |
| --- | --- | --- |
| E1 | Navigate directly to `/learn/<some-other-learners-assignment-id>` | `404`-driven error state shown via `<Status>`, not another learner's video |
| E2 | Navigate to `/learn/<a-nonexistent-id>` | Same 404 error state |
| E3 | If the browser blocks autoplay after answering a question | Inline notice: "Select play to continue the video." (video does not silently stay paused with no explanation) |
| E4 | Load a lesson whose `videoUrl` is broken/unreachable | Inline error: "This video could not be played. Ask the admin to use a direct HTTPS MP4 link..." |

## F. Cross-check with admin-side data

| # | Steps | Expected |
| --- | --- | --- |
| F1 | As learner, answer a question incorrectly; then, as admin, open Reports for that lesson | The response row shows the learner's actual (wrong) answer, the correct answer, and an "Incorrect" badge |
| F2 | As learner, complete an entire lesson; then, as admin, open Reports for that lesson | Progress table shows that learner at `completed`, 100% |

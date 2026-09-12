# E2E manual test plan: admin flows

Prerequisites: MongoDB running, `npm run seed --workspace server`, then
`npm run dev` from the repo root. Sign in at `http://localhost:5173` as
`admin@example.com` / `Password123!`.

## A. Login and navigation

| # | Steps | Expected |
| --- | --- | --- |
| A1 | Load `http://localhost:5173/` while signed out | Redirects to `/login` |
| A2 | Log in with correct credentials | Redirects to `/admin/videos` |
| A3 | Log in with a wrong password | Inline error, stays on `/login` |
| A4 | While logged in as admin, manually visit `/learn` | Redirected back to `/admin/videos` (wrong-role guard) |
| A5 | Refresh the page while on `/admin/reports` | Stays logged in, stays on the same page |
| A6 | Click "Sign out" | Redirects to `/login`; a subsequent back-navigation to `/admin/videos` also redirects to `/login` |

## B. Videos page

| # | Steps | Expected |
| --- | --- | --- |
| B1 | Open **Videos** | All 6 seeded courses listed, one showing a `Draft` pill |
| B2 | Click **New video**, fill in a valid MP4 URL + title + duration, save | New video appears in the list as `Draft` |
| B3 | Click **New video**, leave the URL blank, try to save | Browser-native validation blocks submission (required field) |
| B4 | Click **New video**, enter a non-URL string in Video URL, try to save | Browser-native `type="url"` validation blocks submission |
| B5 | Click **Edit** on an existing video, change the title, save | List reflects the new title immediately |
| B6 | Click **Publish** on the draft created in B2 | Pill flips to `Published` |
| B7 | Click **Unpublish** on a published video | Pill flips to `Draft`; confirm it's no longer selectable in Assignments (see C2) |
| B8 | Click **Delete** on a video with no questions/assignments, cancel the confirm dialog | Video remains in the list |
| B9 | Click **Delete** on the same video, confirm | Video disappears from the list |
| B10 | Click **Delete** on a seeded video that **does** have questions/assignments, confirm | Video disappears; open **Reports** and confirm that video no longer appears in the lesson dropdown |

## C. Assignments page

| # | Steps | Expected |
| --- | --- | --- |
| C1 | Open **Assignments** | Existing seeded assignments listed with learner name/email and video title |
| C2 | Open the "Published video" dropdown | Only published videos listed (drafts absent) |
| C3 | Assign a published video to a learner not already assigned to it | New row appears; success message shown |
| C4 | Attempt to assign the same video+learner pair again | Inline error message shown (server rejected the duplicate); no duplicate row created |
| C5 | Click **Remove** on an assignment | Row disappears from the list |
| C6 | (If reachable) Open Assignments with zero published videos | "Assign video" button disabled, hint text shown |

## D. Questions page

| # | Steps | Expected |
| --- | --- | --- |
| D1 | Open **Questions** for a seeded course | Existing questions listed with timestamp + type |
| D2 | Click **Edit** on a seeded single-choice question | Form pre-fills prompt/timestamp/options, and the previously-correct option is pre-checked |
| D3 | Click **Add question**, choose **Single choice**, enter 2+ options, check exactly one as correct, submit | New question appears in the list |
| D4 | In the same form, try checking a second radio | Only the most recently clicked option stays checked (single-choice enforced client-side) |
| D5 | Click **Add question**, choose **Multiple choice**, check 2+ options as correct, submit | New question created with all checked options in its answer key (verify via Reports or by re-opening Edit) |
| D6 | Click **Add question**, choose **Single/Multiple choice**, leave every option unchecked, submit | Inline server error: "Choice questions need at least one correct option" |
| D7 | Click **Add question**, choose **Short answer**, enter 2+ accepted answers (one per line), submit | New question created |
| D8 | Click **Add question**, choose **Short answer**, leave accepted answers blank, submit | Browser-native required-field validation blocks submission |
| D9 | On a choice question form, click **Remove** down to 2 remaining options | Remove button disables at 2 (server minimum) |
| D10 | Click **Add option**, add a 3rd/4th/5th option | New option row appears, editable |
| D11 | Click **Delete** on a question, confirm | Question disappears from the list |
| D12 | Add a question at a timestamp already used by another question on the same video | Inline server error (duplicate-timestamp conflict) |
| D13 | Add a question with `timestampSeconds` ≥ the video's duration | Inline server error about timestamp being within duration |

## E. Reports page

| # | Steps | Expected |
| --- | --- | --- |
| E1 | Open **Reports** with no lesson selected | Prompt shown: "Select a lesson to see its learner progress and graded responses." |
| E2 | Select a published seeded course with mixed demo data | Progress table shows each assigned learner's status/percentage/last-watched; responses table shows each submitted answer with a correct/incorrect badge and a running `X/Y correct` tally |
| E3 | Select the draft (unpublished) course | Still selectable; progress/response tables render (likely empty, since drafts can't be assigned) |
| E4 | Select a course with assignments but zero submitted answers | Progress table populated; responses table shows "No answers submitted yet." |
| E5 | Cross-check one learner's response row against the answer key shown in the Questions page for that question | The report's "Correct answer" column matches the option(s)/accepted answers marked correct in the editor |

## F. Cross-feature checks

| # | Steps | Expected |
| --- | --- | --- |
| F1 | Publish a new video, immediately assign it, immediately view it in Reports | All three actions succeed in sequence with no stale-cache issues (each mutation invalidates the relevant list) |
| F2 | Delete a video that has an active learner assignment while that learner is mid-playback in another browser tab | The learner's next progress save or page refresh surfaces a 404 gracefully (see [06-edge-cases-and-negative-scenarios.md](06-edge-cases-and-negative-scenarios.md)) |

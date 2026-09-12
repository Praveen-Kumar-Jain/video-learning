# Test plan and delivery path

> This is a condensed summary. The full test plan — a complete API test
> matrix (positive/negative/boundary cases per endpoint), step-by-step admin
> and learner end-to-end flows, cross-cutting edge cases, and a release-gate
> checklist — lives in [`docs/testing/`](testing/), starting at
> [`docs/testing/00-test-strategy-and-tooling.md`](testing/00-test-strategy-and-tooling.md).

## Automated tests available now

Run all checks from the repository root:

```powershell
npm run test --workspace server
npm run test --workspace client
npm run build --workspace client
```

| Area | Test file | Current coverage |
| --- | --- | --- |
| API shell | `server/test/app.test.js` | Health check and 404 format |
| Data models | `server/test/models.test.js` | Required fields and enums |
| Grading | `server/test/grading.test.js` | Single/multiple/short-answer correctness, order-independent |
| Authentication | `server/test/auth.routes.test.js` | Input validation and protected profile |
| Videos/questions | `server/test/video.routes.test.js` | Authentication boundary |
| Assignments/reports | `server/test/assignment.routes.test.js` | Authentication boundary |
| Shared UI | `client/src/components/Status.test.jsx` | Loading, error, and empty states |
| Login | `client/src/pages/LoginPage.test.jsx` | Form rendering and user input |

By design, the route-level server tests check the authentication/authorization
boundary rather than exercising full request/response cycles against a real
database — there is no MongoDB-backed integration suite. `grading.test.js` is
a pure-function unit test and needs no database.

## Manual end-to-end acceptance flow

1. Set the server environment variables and start MongoDB.
2. Run the seed script, then run both applications.
3. Sign in as the admin and create a draft video with a direct MP4 URL and correct duration.
4. Add a single-choice, multiple-choice, and short-answer timestamp question,
   marking the correct option(s)/accepted answers in the question form, then
   publish the video.
5. Edit one of the questions and confirm the previously marked correct answer
   is preselected; delete another question and confirm it disappears.
6. Assign the video to a learner from the Assignments screen.
7. Sign in as the learner, open the assignment, and verify it starts or resumes at the saved timestamp.
8. At each timestamp, verify playback pauses, the correct question is shown, and submitting resumes playback.
9. Refresh after a response and verify answered questions are not shown again.
10. Pause part way through, refresh, and verify playback resumes near the stored time.
11. Finish the video and verify progress is 100% and status is `completed`.
12. As admin, open **Reports**, select the video, and confirm the learner's
    progress row and graded response row (with a correct/incorrect badge) match
    what was just submitted.
13. Open `http://localhost:5000/api/docs` and confirm Swagger UI lists all route
    groups.

## Next implementation sequence

1. Add MongoDB-backed route integration tests using a dedicated test database
   (e.g. `mongodb-memory-server`), if deeper backend regression coverage is
   needed later.
2. Add Docker Compose for a one-command local app + MongoDB setup.
3. Add real file upload for videos (multer + storage), instead of direct-URL entry.
4. Capture the Loom demo and prepare submission artifacts.

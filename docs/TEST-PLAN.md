# Test plan and delivery path

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
| Authentication | `server/test/auth.routes.test.js` | Input validation and protected profile |
| Videos/questions | `server/test/video.routes.test.js` | Authentication boundary |
| Assignments/reports | `server/test/assignment.routes.test.js` | Authentication boundary |
| Shared UI | `client/src/components.test.jsx` | Loading, error, and empty states |
| Login | `client/src/pages.test.jsx` | Form rendering and user input |

## Manual end-to-end acceptance flow

1. Set the server environment variables and start MongoDB.
2. Run the seed script, then run both applications.
3. Sign in as the admin and create a draft video with a direct MP4 URL and correct duration.
4. Add a single-choice, multiple-choice, and short-answer timestamp question; publish the video.
5. Assign it to the seeded learner using the assignment API. (This will move to the UI in the next feature step.)
6. Sign in as the learner, open the assignment, and verify it starts or resumes at the saved timestamp.
7. At each timestamp, verify playback pauses, the correct question is shown, and submitting resumes playback.
8. Refresh after a response and verify answered questions are not shown again.
9. Pause part way through, refresh, and verify playback resumes near the stored time.
10. Finish the video and verify progress is 100% and status is `completed`.
11. As admin, inspect progress and response report API responses for the learner.

## Next implementation sequence

1. Add admin learner-progress and response-report screens.
2. Complete question edit/delete and answer-key UI.
3. Add MongoDB-backed route integration tests using a dedicated test database.
4. Add Swagger/OpenAPI docs, Docker local setup, and final README/API documentation.
5. Run the acceptance flow, capture the Loom demo, and prepare submission artifacts.

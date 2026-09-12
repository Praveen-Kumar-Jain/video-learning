# Implementation so far

## Completed foundation

- Monorepo with `client` (React/Vite) and `server` (Node.js/Express).
- MongoDB data models: `User`, `Video`, `Question`, `Assignment`, `Progress`, and `Response`.
- JWT authentication and two roles: `admin` and `learner`.
- API groups for authentication, videos, timestamp questions, assignments, learner progress/responses, and admin reports.
- A seed script with an admin, learner, published demo video, question, and assignment.
- React routes for login, admin videos, question creation, learner assignments, and the video player.
- Admin assignment-management screen with learner/video selection, assignment list, and assignment removal.
- Player behavior: pauses for an unanswered timestamp question, saves answers, persists progress on pause/interval, and resumes from the stored timestamp.

## Intentional current limits

- The admin reporting screens have not yet been created, although their APIs exist.
- Question editing/deletion and answer-key editing need UI work.
- Automated integration tests will need an isolated MongoDB test database; the current automated suite tests app behavior that does not require a database connection.
- API documentation (Swagger/OpenAPI), Docker, and browser-level end-to-end tests remain future work.

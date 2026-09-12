# Implementation status

> This is a condensed summary. For a per-feature breakdown of what was built,
> how, and why — plus what's next for each area — see
> [`docs/backend/`](backend/) and [`docs/frontend/`](frontend/), starting at
> their respective `00-overview-and-architecture.md`.

## Completed

- Monorepo with `client` (React/Vite) and `server` (Node.js/Express).
- MongoDB data models: `User`, `Video`, `Question`, `Assignment`, `Progress`, and `Response`.
- JWT authentication and two roles: `admin` and `learner`.
- API groups for authentication, videos, timestamp questions (including their
  answer key), assignments, learner progress/responses, and admin reports.
- Server-side grading (`server/src/utils/grading.js`): responses are compared
  against a question's correct option(s) or accepted short answers, and admin
  reports show each response's correctness alongside the correct answer.
- A rich seed script (`server/src/seed.js`): 1 admin, 8 learners, and 6 course
  videos (one left as an unpublished draft), each with 2-4 timestamp questions
  and a real answer key. Assignments and progress/response history are seeded
  across learners to cover every state a demo needs: not-started, in-progress
  with partial (mixed correct/incorrect) answers, fully completed with all
  answers correct, fully completed with some wrong answers, and a learner with
  no assignments at all.
- React routes for login, admin videos/questions/assignments/reports, learner
  assignments, and the video player — organized under `client/src/pages/` and
  `client/src/components/`, one file per page/component.
- Admin video management: create/edit/delete/publish.
- Admin question management: create/edit/delete, with per-option "correct
  answer" checkboxes for single/multiple choice and an accepted-answers list
  for short answer.
- Admin assignment management: learner/video selection, assignment list, and
  assignment removal.
- Admin reports screen: pick a lesson, see per-learner progress and a graded
  response table.
- Player behavior: pauses for an unanswered timestamp question, saves answers,
  persists progress on pause/interval, and resumes from the stored timestamp.
- Swagger/OpenAPI documentation (`server/openapi.yaml`), served at
  `GET /api/docs` (UI) and `GET /api/docs.json` (raw spec).
- Server and client source formatted with Prettier (`npm run format`).

## Intentional current limits

- Video input is a direct MP4 URL, not a file upload from disk.
- Automated integration tests exercise app/auth-boundary behavior without a
  database connection; there is no dedicated MongoDB-backed test suite (this
  was a deliberate scope decision, not an oversight — see `docs/TEST-PLAN.md`).
- No Docker/CI setup; local Node.js + MongoDB is the supported path.
- Learners never see whether their quiz answer was right or wrong — grading is
  surfaced to admins in Reports only, matching the existing "quick check"
  player UX.

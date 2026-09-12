# Video Learning Platform

A full-stack timestamp-based video quiz platform. The backend is Node.js + Express;
the frontend is React + Vite; persistence is MongoDB.

For the full first-time setup, test-video URLs, and end-to-end checklist, see [STARTUP.md](STARTUP.md).

## Prerequisites

- Node.js 20+
- MongoDB running locally, or a MongoDB connection string

## Local setup

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and a strong `JWT_SECRET`.
2. Optionally copy `client/.env.example` to `client/.env` if the API is not on `http://localhost:5000/api`.
3. Install dependencies: `npm install`.
4. Seed demo data: `npm run seed --workspace server`.
5. Run both applications: `npm run dev`.

The client runs on `http://localhost:5173`; the API runs on `http://localhost:5000`.

## Sample credentials

All seeded accounts use the password `Password123!`.

| Role | Email | Notes |
| --- | --- | --- |
| Admin | `admin@example.com` | Owns all 6 seeded course videos |
| Learner | `learner@example.com` | Mixed demo data: one in-progress course, one completed, one assigned-but-not-started |
| Learner | `mia.chen@example.com` | A fully completed course, all answers correct |
| Learner | `daniel.osei@example.com` | Completed courses with a mix of right/wrong answers |
| Learner | `emma.rossi@example.com` | No assignments yet (empty-state demo) |

See [STARTUP.md](STARTUP.md) for the full seeded roster and course catalog.

## Current API

- `POST /api/auth/login`, `GET /api/auth/me`
- Video CRUD (create/edit/delete) plus publish/unpublish
- Timestamp-question CRUD, including the answer key (correct option(s) or accepted
  short answers) used for grading
- Assignment CRUD; learner assignment list, playback payload, progress updates,
  and answer submission
- Admin progress and graded-response reports per video

All administrative routes require an admin JWT, and learner playback routes require
an assignment owned by the authenticated learner.

Interactive API documentation (Swagger UI) is served at `http://localhost:5000/api/docs`
once the server is running; the raw OpenAPI document is at `/api/docs.json`.

## Admin UI

- **Videos** — create/edit/delete/publish lessons.
- **Questions** — add timestamp questions with per-option "correct answer" checkboxes
  (single/multiple choice) or a list of accepted short answers, plus edit/delete.
- **Assignments** — assign published lessons to learners and remove assignments.
- **Reports** — pick a lesson and see per-learner progress and a graded response
  table (learner's answer vs. the correct answer, with a correct/incorrect badge).

## Code quality

Server and client source is formatted with Prettier (`npm run format` at the repo
root). Client pages/components are split one-file-per-concern under
`client/src/pages/` and `client/src/components/`, mirroring the server's
`routes/`/`models/` layout.

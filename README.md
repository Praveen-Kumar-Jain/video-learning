# Video Learning Platform

A local full-stack assessment project for timestamp-based video quizzes. The backend is Node.js + Express (not NestJS); the frontend is React + Vite; persistence is MongoDB.

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

- Admin: `admin@example.com` / `Password123!`
- Learner: `learner@example.com` / `Password123!`

## Current API

- `POST /api/auth/login`, `GET /api/auth/me`
- Video CRUD plus publish/unpublish and timestamp-question CRUD
- Create assignments; learner assignments, playback payload, progress updates, and responses
- Admin progress and response reports

All administrative routes require an admin JWT, and learner playback routes require an assignment owned by the authenticated learner.

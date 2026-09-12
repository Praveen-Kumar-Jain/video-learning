# Architecture

```text
React + Vite client
        | JWT bearer token over HTTP
Node.js + Express API
        | Mongoose
MongoDB
```

## Request flow

1. A user logs in at `POST /api/auth/login`; the API returns a signed JWT and public user profile.
2. The React Axios client stores the token in browser storage and sends it as a bearer token.
3. `requireAuth` verifies the token and loads the user; `requireRole` limits admin-only routes.
4. Controllers validate payloads using Zod, then read or write Mongoose models.
5. The API returns JSON. A shared Express error handler normalizes validation, invalid-ID, duplicate-key, and unexpected errors.

## Playback flow

1. Learner opens an assignment and receives its video, sanitized questions, and saved progress.
2. The player resumes at `lastWatchedSecond`.
3. At an unanswered question timestamp, it pauses and displays the question.
4. Submission saves a `Response` and adds the question to `Progress.answeredQuestionIds`.
5. The player resumes. Progress is saved while watching, when paused, and on completion.

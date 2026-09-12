# Startup and end-to-end testing guide

This project is a local React, Node.js/Express, and MongoDB application. The UI currently accepts **direct public MP4 URLs**; it does not yet support uploading a video file from your computer.

## 1. Prerequisites

Install Node.js 20 or newer and MongoDB Community Server. Confirm Node.js is available:

```powershell
node --version
npm --version
```

Start your local MongoDB service. If you instead use MongoDB Atlas, make sure your current IP address is allowed by its network-access settings.

## 2. Configure the server

From the repository root, create the private server configuration file:

```powershell
Copy-Item server\.env.example server\.env
```

Set these values in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/video-learning
JWT_SECRET=replace-this-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

`MONGODB_URI` and `JWT_SECRET` are required. Do not commit this file.

For a local database, use the value shown above. For Atlas, use your supplied connection string, for example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/video-learning?retryWrites=true&w=majority
```

The frontend already points to the default local API. Only create `client/.env` if that API URL changes:

```env
VITE_API_URL=http://localhost:5000/api
```

## 3. Install and seed

Install all packages once:

```powershell
npm install
```

Seed the demo database:

```powershell
npm run seed --workspace server
```

Warning: the seed command clears the application's users, videos, questions, assignments, progress, and responses, then creates fresh demo data.

It creates these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Password123!` |
| Learner | `learner@example.com` | `Password123!` |

The seeded lesson uses the public Sintel trailer, which includes an audio track, and pauses at 10 seconds.

## 4. Start the application

Run both backend and frontend from the repository root:

```powershell
npm run dev
```

Open these addresses:

| Service | Address |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API health check | `http://localhost:5000/api/health` |

The health check must return:

```json
{ "status": "ok" }
```

## 5. Ready-to-use test videos

Paste one of these **direct MP4 URLs** into the Video URL field. They were checked for an HTTP `200` response and `video/mp4` content type on 2026-09-12.

| Video | Direct URL | Suggested duration | Suggested question timestamps |
| --- | --- | ---: | --- |
| Short flower clip (no audio) | `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` | `5` seconds | `2`, `4` |
| Sintel trailer | `https://media.w3.org/2010/05/sintel/trailer.mp4` | About `52` seconds | `10`, `25`, `40` |

For the duration, use the value displayed by your browser's video controls after it loads. Keep every question timestamp strictly lower than the duration.

## 6. End-to-end manual test

### Admin

1. Log in as `admin@example.com`.
2. Open **Videos**, choose **New video**, and paste a direct MP4 URL from the table.
3. Enter title, duration, and optional description/thumbnail, then save.
4. Open **Questions** for that video.
5. Add single-choice, multiple-choice, and short-answer questions at valid timestamps.
6. Return to **Videos** and publish the video.
7. Open **Assignments**, select the video and `Learner User`, then choose **Assign video**.
8. Confirm the new assignment is listed.

### Learner

1. Sign out and log in as `learner@example.com`.
2. Open **My learning** and start the newly assigned video.
3. Confirm video playback begins.
4. At a configured timestamp, confirm playback pauses and the quiz appears.
5. Submit an answer and confirm playback resumes.
6. Pause the video, refresh the page, and confirm it resumes near the saved point.
7. Refresh after answering a question and confirm that question does not reappear.
8. Finish the video and confirm the course shows `100% complete`.

## 7. Automated checks

Run these commands before committing or submitting:

```powershell
npm run test --workspace server
npm run test --workspace client
npm run build --workspace client
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API does not start | Verify `server/.env`, `MONGODB_URI`, and that MongoDB is running. |
| Frontend cannot log in | Confirm API runs on port `5000` and client URL is `http://localhost:5173`. |
| Video will not play | Use a direct HTTPS MP4 URL, not a YouTube page, Google Drive share page, or video webpage. Check the browser console for CORS/network errors. |
| Question never appears | Confirm the video is published, assigned to the learner, timestamp is below duration, and it has not already been answered. |
| Seed command fails | Ensure MongoDB is reachable; the command needs a valid `MONGODB_URI`. |

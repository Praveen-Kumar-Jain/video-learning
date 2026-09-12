# Authorization and roles

Source: [`server/src/middleware/auth.js`](../../server/src/middleware/auth.js),
every file under [`server/src/routes/`](../../server/src/routes/).

## What was built

Two roles: `admin` and `learner` (`User.role`, enum-constrained). Every route
in the API declares, via middleware, exactly who may call it:

- **Admin-only**: video/question CRUD and publish, assignment create/list/
  delete, both report endpoints, the learner-list endpoint.
- **Learner-only**: "my assignments", playback payload, progress updates,
  answer submission.
- **Either role, different data**: `GET /api/videos` and `GET
  /api/videos/:videoId/questions` — same URL, different response shape
  depending on `req.user.role` (see below).
- **Public**: `POST /api/auth/login`, `GET /api/health`, `GET /api/docs*`.

## How it works

`requireRole(...roles)` is a middleware factory:

```js
export function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user.role) ? next() : res.status(403).json({ message: '...' });
}
```

It's composed after `requireAuth` on the route definition, e.g.:

```js
router.post('/', requireAuth, requireRole('admin'), asyncHandler(...));
```

so `req.user` is guaranteed to exist by the time `requireRole` runs.

Two routes intentionally **don't** use `requireRole` and instead branch on
`req.user.role` inside the handler, because the *same* endpoint needs to
return different data per role rather than being denied outright:

- `GET /api/videos` (`video.routes.js`): admins get every video; learners get
  only the videos they have a **published** assignment for, via a query that
  populates `Assignment.videoId` with a `match: { isPublished: true }` filter
  and drops assignments whose video didn't match (i.e., was deleted or is a
  draft).
- `GET /api/videos/:videoId/questions`: both roles get the question list, but
  the answer key (`correctOptionIds`, `acceptedAnswers`) is stripped out for
  non-admins before the response is sent — that stripping is the actual
  authorization boundary here, not route access.

### Ownership checks (not just role checks)

Role alone isn't enough for the learner routes — a learner must only ever see
*their own* assignment, not any assignment. Every learner-scoped route
(`/:assignmentId/play`, `/:assignmentId/progress`,
`/:assignmentId/responses`) goes through:

```js
function learnerAssignment(id, learnerId) {
  return Assignment.findOne({ _id: id, learnerId });
}
```

If the assignment doesn't belong to the caller, this returns `null` and the
route responds `404 Assignment not found` — indistinguishable from "doesn't
exist" — rather than `403 Forbidden`, which would confirm to an attacker that
the ID is valid but belongs to someone else.

## Why it works this way

- **Middleware composition over per-handler `if` checks**: `requireRole` is
  declared once per route and reads like a permission label in the route
  table, rather than being buried in handler logic. It's also impossible to
  forget — a route with no `requireRole` and no explicit branching is
  visibly "any authenticated user," which is easy to spot in review.
- **Data-shape branching for the two dual-role routes**, instead of exposing
  `GET /api/videos` vs. a separate `GET /api/my-videos`: the client already
  needs "the list of videos I can act on" regardless of role, so one endpoint
  with role-aware filtering keeps the frontend's data-fetching code simpler.
- **`404` instead of `403` for ownership failures**: a deliberate
  anti-enumeration choice — never confirm that a resource ID exists to a
  caller who isn't allowed to see it.
- **Stripping the answer key at the route layer** (not just hiding it in the
  UI): even if a learner opens devtools and inspects the network tab, the
  correct answers are never sent to their browser in the first place.

## Test cases

See [`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md)
for the full matrix: admin-only routes called as a learner (expect 403),
learner-only routes called as an admin (expect 403), one learner's
assignment ID used by a different logged-in learner (expect 404, not 403 or
200), and the answer-key-stripping check on the questions endpoint.

## What further can be done

- A third role (e.g. **manager**, who can view reports for their team but not
  edit content) would require extending `requireRole` calls and probably a
  `managerOf` relationship on `User` — no structural change needed.
- Per-video admin ownership (today any admin can edit any video; there's no
  concept of "my videos only").
- Field-level permission checks via a policy/ability library if the number of
  roles and exceptions grows past what's comfortable to express as
  route-level middleware.

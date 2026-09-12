# Validation and error handling

Source: [`server/src/middleware/error.js`](../../server/src/middleware/error.js),
[`server/src/utils/asyncHandler.js`](../../server/src/utils/asyncHandler.js),
the Zod schemas at the top of each route file.

## What was built

A consistent request-validation and error-response strategy applied
uniformly across every route:

- Every route validates its input with a **Zod schema** before touching the
  database.
- Every async route handler is wrapped in **`asyncHandler`** so a thrown/
  rejected error reaches Express's error-handling chain instead of crashing
  the process or hanging the request.
- A single **`errorHandler`** middleware normalizes every error type into a
  consistent `{ message }` (plus `errors` for validation failures) JSON
  response with an appropriate status code.
- A **`notFound`** middleware catches any request that didn't match a route
  at all, returning a consistent 404 shape.

## How it works

```js
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
```

Every route handler in the codebase is passed through this wrapper. Without
it, a rejected promise inside an `async` Express handler is swallowed by
default (Express 4 doesn't await handlers), and the request would hang or
crash the process instead of producing an error response.

`errorHandler` inspects the error and maps it to a status code:

| Error | Cause | Response |
| --- | --- | --- |
| `ZodError` | Request body/params failed schema validation | `400 { message: 'Validation failed', errors: error.issues }` |
| `CastError` | A route param that should be an ObjectId isn't one (e.g. `/videos/not-an-id`) | `400 { message: 'Invalid resource identifier' }` |
| `code === 11000` | A MongoDB unique-index violation (duplicate question timestamp, duplicate assignment, etc.) | `409 { message: 'A record with that value already exists' }` |
| Anything else | Unexpected | `error.status \|\| 500`, `error.message \|\| 'Internal server error'` |

Every error is also `console.error`'d for server-side visibility before the
response is built.

Route-level "business rule" failures (e.g. "publish the video before
assigning it," "choice questions need at least one correct option") are
**not** thrown as exceptions — they're handled with an early
`return res.status(400).json({ message: ... })` right in the route, because
they're expected, named conditions specific to that route, not generic
infrastructure errors.

## Why it works this way

- **Zod at the boundary, not scattered `if` checks**: schemas declare the
  shape once, at the top of the file, and every route that uses them gets
  consistent, structured 400 errors for free — no handler has to manually
  check `typeof req.body.title === 'string'`.
- **One `asyncHandler` wrapper applied everywhere** rather than `try/catch`
  in every handler: removes an entire category of "forgot to catch the
  rejected promise" bugs, and keeps handlers focused on business logic.
- **Centralizing error-to-status mapping in one place**: any route that
  starts using a new Mongoose feature (a new unique index, a new cast-able
  param) automatically gets the right status code without that route having
  to know about `CastError`/`11000` itself.
- **Business-rule failures via early return, not thrown errors**: these
  aren't exceptional in the programming sense — they're expected, specific,
  user-facing messages ("Publish the video before assigning it to learners")
  that read better as a direct response than as a generically-formatted
  caught exception.
- **Generic internal-error message for anything unmapped**: avoids ever
  leaking a stack trace or internal detail to a client, while still logging
  the full error server-side for debugging.

## Test cases

`server/test/auth.routes.test.js` covers the `ZodError → 400` path directly
(malformed login payload). See
[`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md)
for the full matrix across every route: malformed body per endpoint,
non-ObjectId path params (`CastError`), duplicate-key conflicts (question
timestamp, assignment pair), and confirming the generic 404 handler's
message format for a totally unknown route.

## What further can be done

- **Structured error codes** (e.g. `VIDEO_NOT_PUBLISHED`) in addition to
  human-readable messages, so the client could branch on error type without
  string-matching the message.
- **Request logging correlation IDs** to tie a client-visible error back to
  a specific server log line in production.
- **Rate limiting / request size limits** as an additional layer of
  input-hardening beyond schema validation.

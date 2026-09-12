# Authentication

Source: [`server/src/routes/auth.routes.js`](../../server/src/routes/auth.routes.js),
[`server/src/middleware/auth.js`](../../server/src/middleware/auth.js),
[`server/src/models/User.js`](../../server/src/models/User.js).

## What was built

- `POST /api/auth/login` — accepts `{ email, password }`, verifies the
  password against a bcrypt hash, and returns `{ token, user }`.
- `GET /api/auth/me` — returns the signed-in user's public profile, given a
  valid bearer token.
- `requireAuth` middleware — verifies the JWT on every protected route and
  loads the current `User` from the database onto `req.user`.

## How it works

1. **Password storage.** `User.passwordHash` is a bcrypt hash (`bcryptjs`,
   cost factor 12, set in `seed.js` and expected to be set the same way
   anywhere a user is created). The field has `select: false` in the schema,
   so it is never returned by a normal `find`/`findById` — the login route
   explicitly opts in with `.select('+passwordHash')`, which is the only
   place in the codebase that needs it.
2. **Token issuance.** On successful login, `tokenFor(user)` signs a JWT with
   `{ sub: user.id, role: user.role }` and an 8-hour expiry, using
   `env().jwtSecret`. The role is embedded in the token so it's available
   without a DB round trip in theory, but `requireAuth` still re-fetches the
   user (see "Why" below).
3. **Token verification.** `requireAuth` reads the `Authorization: Bearer
   <token>` header, verifies it with `jwt.verify`, then loads
   `User.findById(payload.sub)` and attaches the full document to `req.user`.
   Any failure (missing header, invalid signature, expired token, user
   deleted) results in a uniform `401 { message: ... }`.
4. **Client-side.** The React client stores `{ token, user }` in
   `localStorage` and an Axios interceptor attaches the bearer token to every
   request (see [`docs/frontend/01-routing-and-auth-guarding.md`](../frontend/01-routing-and-auth-guarding.md)).

## Why it works this way

- **Stateless JWT over sessions**: no session store to provision/scale, and
  the SPA + API split doesn't need server-rendered session cookies. The
  tradeoff (can't invalidate a token before it expires) is acceptable at
  8 hours for this use case.
- **Re-fetching the user on every request** rather than trusting the JWT
  payload alone: this means a role change, a rename, or (most importantly) a
  deleted user takes effect immediately on the next request instead of
  waiting up to 8 hours for the token to expire. The cost is one extra
  `findById` per request, which is cheap and acceptable at this scale.
- **`select: false` on `passwordHash`**: makes it structurally hard to
  accidentally leak a password hash in any JSON response — you have to
  explicitly ask for the field, which only the login route does.
- **Generic error messages** ("Invalid email or password", "Invalid or
  expired access token") rather than distinguishing "wrong password" from
  "no such user": avoids leaking which emails are registered.

## Test cases

See [`docs/testing/01-backend-automated-tests.md`](../testing/01-backend-automated-tests.md)
and [`docs/testing/02-backend-api-manual-test-cases.md`](../testing/02-backend-api-manual-test-cases.md)
for the full authentication test matrix (valid login, wrong password, unknown
email, malformed email, short password, missing/garbled/expired token, etc.).

## What further can be done

- **Refresh tokens** so a learner mid-video isn't logged out by an 8-hour
  cutoff; currently they'd need to log back in and resume from saved
  progress (which does still work).
- **Password reset flow** (currently there is none — an admin would need to
  reseed or manually update a hash).
- **Account lockout / rate limiting** on `POST /api/auth/login` to slow down
  credential-stuffing attempts.
- **Audit log** of logins, especially for admin accounts.
- **SSO/OAuth** if this ever needs to plug into a company identity provider.

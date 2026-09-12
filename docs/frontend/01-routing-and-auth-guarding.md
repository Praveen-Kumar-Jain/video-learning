# Routing and auth guarding

Source: [`client/src/App.jsx`](../../client/src/App.jsx),
[`client/src/auth.jsx`](../../client/src/auth.jsx),
[`client/src/components/Protected.jsx`](../../client/src/components/Protected.jsx).

## What was built

- A single route table (`App.jsx`) covering login, 5 admin routes, and 2
  learner routes.
- `AuthProvider`/`useAuth()` — a small context holding `{ user }` plus
  `login()`/`logout()`, backed by `localStorage`.
- `<Protected role="admin"|"learner">` — a route guard that redirects
  unauthenticated users to `/login` and wrong-role users to their own home.

## How it works

**Session storage.** `AuthProvider` initializes `user` from
`localStorage.getItem('user')` (so a page refresh doesn't lose the session),
and `login({ token, user })` writes both `token` and `user` to
`localStorage` before updating React state. `logout()` clears both. The
token itself is never held in React state — only `user` is, since only
`user` (`name`/`email`/`role`) is ever rendered; the token is read directly
from `localStorage` by the Axios interceptor in `api.js`.

**Route guarding.** `Protected`:

```jsx
export function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/videos' : '/learn'} replace />;
  return children;
}
```

Every admin/learner route in `App.jsx` is wrapped as
`<Protected role="..."><Layout>{page}</Layout></Protected>` via a small local
`Page` helper component, so the guard-then-layout composition is declared
once per route rather than duplicated inside every page component.

**Post-login/home redirect.** `HomeRedirect` (used for `/` and the catch-all
`*` route) and the early return at the top of `LoginPage` both compute
"where does this user belong" the same way: `user.role === 'admin' ?
'/admin/videos' : '/learn'`. This means visiting `/` or an unknown path, or
being already logged in and revisiting `/login`, all converge on the correct
home screen for that role.

## Why it works this way

- **`localStorage`, not an in-memory-only store**: a page refresh (or
  closing and reopening the tab) should not log the user out — for a
  learner mid-video, losing the session on refresh would be a real
  usability regression given the player already supports resuming from
  saved progress.
- **Role-aware redirect target instead of a fixed `/`**: admins and learners
  have entirely disjoint home screens; sending either one to a
  one-size-fits-all landing page would just add an extra redirect hop.
- **A single `Protected` component for both "not authenticated" and "wrong
  role"**, rather than two separate guards: both cases resolve to "you don't
  belong on this screen, here's where you do belong" — the destination just
  differs (`/login` vs. the caller's own home) — so one component with one
  branch covers it cleanly.
- **Guarding declared in the route table (`App.jsx`)**, not inside each page
  component: keeps every page component free to assume "I am only ever
  rendered for an authenticated user of the right role," which simplifies
  every page's own logic (no repeated "if no user, return null" checks
  scattered through `VideosPage`, `PlayerPage`, etc.).

## Test cases

See [`docs/testing/03-frontend-automated-tests.md`](../testing/03-frontend-automated-tests.md)
and [`docs/testing/04-e2e-admin-flow-test-plan.md`](../testing/04-e2e-admin-flow-test-plan.md) /
[`docs/testing/05-e2e-learner-flow-test-plan.md`](../testing/05-e2e-learner-flow-test-plan.md):
visiting an admin route while signed out (redirects to `/login`), visiting an
admin route as a learner and vice versa (redirects to own home), refreshing
mid-session (stays logged in), signing out and confirming a subsequent
back-navigation to a protected route redirects to `/login` rather than
showing stale content.

## What further can be done

- **Token expiry handling**: today, an expired JWT surfaces as a generic
  `401` from whichever API call happens to fire next, rather than proactively
  detecting expiry and redirecting to `/login` with a "session expired"
  message.
- **A global Axios response interceptor** that catches any `401` and forces
  a logout/redirect, instead of each page's React Query error state handling
  it independently (today a `401` just renders as a generic error via
  `<Status error>`).
- **Deep-link preservation**: redirecting to `/login` currently doesn't
  remember the originally-requested URL to return to after signing in.

# Frontend overview and architecture

## What this is

A React + Vite single-page app for the same platform: an admin console for
managing videos/questions/assignments/reports, and a learner console for
watching assigned lessons and answering timestamp quizzes.

## Stack and why

| Concern | Choice | Why |
| --- | --- | --- |
| Build tool | Vite | Fast dev server + HMR, minimal config, already the project's choice. |
| Routing | `react-router-dom` v7 | Standard SPA routing with nested/guarded routes. |
| Server state | `@tanstack/react-query` | Caching, request de-duplication, and a declarative `invalidateQueries` pattern for keeping data fresh after a mutation, without hand-rolled loading/error state per screen. |
| HTTP | `axios` with an interceptor | One place to attach the bearer token to every request. |
| Styling | Plain CSS (`styles.css`), class-based | No component library or CSS-in-JS dependency; the whole app's visual language fits in one readable stylesheet. See [09-styling-and-design-system.md](09-styling-and-design-system.md). |

## Folder layout

```
client/src/
  main.jsx              # Entry point: React root, QueryClientProvider, BrowserRouter
  App.jsx                # Route table
  auth.jsx               # AuthProvider/useAuth — session state (token + user in localStorage)
  api.js                 # Axios instance with bearer-token interceptor
  styles.css
  components/
    Layout.jsx            # Header/nav/sign-out, wraps every authenticated page
    Protected.jsx          # Role-based route guard
    Status.jsx             # Shared loading/error/empty renderer
    index.js               # Barrel export
  pages/
    LoginPage.jsx
    admin/
      VideosPage.jsx
      QuestionsPage.jsx
      AssignmentsPage.jsx
      ReportsPage.jsx
    learner/
      HomePage.jsx
      PlayerPage.jsx
```

This mirrors the server's `routes/`/`models/` split: one file per
page/component, grouped by audience (`admin/` vs `learner/`), instead of the
original layout where every page and every shared component lived in one
large `pages.jsx`/`components.jsx` file each. See
[08-shared-components-and-data-fetching.md](08-shared-components-and-data-fetching.md)
for why this restructure was done and how the pieces fit together.

## Rendering flow

1. `main.jsx` wraps the app in `QueryClientProvider` (React Query cache) and
   `BrowserRouter`.
2. `App.jsx` renders `AuthProvider` around the route table, so `useAuth()` is
   available anywhere.
3. Every authenticated route is wrapped in `<Protected role="...">` (redirect
   to `/login` if signed out, redirect to the other role's home if signed in
   with the wrong role) and `<Layout>` (header/nav) — see
   [01-routing-and-auth-guarding.md](01-routing-and-auth-guarding.md).
4. Each page fetches its own data with `useQuery`/`useMutation`, rendering
   through the shared `<Status>` component for loading/error/empty states.

## Where to go next

Each of the other frontend docs covers one page or cross-cutting concern
(what was built, how, and why), followed by
[10-future-work.md](10-future-work.md) for what's intentionally deferred.

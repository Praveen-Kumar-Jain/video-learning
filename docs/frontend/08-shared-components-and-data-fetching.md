# Shared components and data-fetching patterns

Source: [`client/src/components/`](../../client/src/components/).

## What was built

Three small, reused-everywhere components (`Layout`, `Protected`, `Status`),
plus a consistent React Query pattern used by every page, replacing the
original single-file `components.jsx`/`pages.jsx` layout with one
file per component/page under `components/` and `pages/`.

## How it works

**`Status`** (`components/Status.jsx`) is the workhorse: every data-fetching
page renders its list/content through it —

```jsx
<Status loading={query.isLoading} error={query.error} empty={!query.data?.length && 'No videos yet.'}>
  {query.data?.map(...)}
</Status>
```

It renders (in priority order) a loading message, an error message
(`error.message` if present, else a generic fallback), an empty-state
message if `empty` is truthy, or otherwise its `children`. Every page in the
app uses the exact same three-state convention, so a developer reading any
page already knows what "loading"/"no data"/"error" look like without
re-deriving it per screen.

**`Protected`** and **`Layout`** — see
[01-routing-and-auth-guarding.md](01-routing-and-auth-guarding.md) for
`Protected`; `Layout` renders the header/nav (role-aware links, current
user's name, sign-out button) around every authenticated page's content.

**The restructure.** Before this pass, every page component (`LoginPage`,
`AdminVideosPage`, `QuestionsPage`, `AdminAssignmentsPage`,
`LearnerHomePage`, `PlayerPage`) lived in one `pages.jsx` file, and all
shared components lived in one `components.jsx` file — both written as
extremely dense single-line function bodies. This pass split each
page/component into its own file under `pages/` (grouped `admin/`/`learner/`)
and `components/`, matching the server's existing `routes/`/`models/`
one-concern-per-file convention, and reformatted everything with Prettier
into normal multi-line code. No behavior changed as part of the split itself
— see the top-level `docs/IMPLEMENTATION-SO-FAR.md` for the full list of
what *did* change functionally alongside it.

**Data-fetching convention.** Every page follows the same shape:

```js
const query = useQuery({ queryKey: [...], queryFn: () => api.get(...).then(r => r.data.thing) });
const mutation = useMutation({
  mutationFn: (payload) => api.post/patch/delete(...),
  onSuccess: () => client.invalidateQueries({ queryKey: [...] }),
});
```

Every mutation's `onSuccess` invalidates the relevant query key rather than
manually writing the new data into the cache (`setQueryData`). Related pages
that share a query key (e.g. both the Videos page and the Reports page use
`['admin-videos']`) benefit from React Query's cache: whichever loads first
populates it for the other.

## Why it works this way

- **One shared `Status` component instead of ad hoc loading/error/empty
  JSX per page**: guarantees visual and behavioral consistency (every
  "empty" message looks the same, every error falls back to the same
  generic text) and means a future global styling change to how loading/
  errors look only has to happen in one file.
- **Splitting `pages.jsx`/`components.jsx` into one file per
  page/component**: the original files mixed unrelated concerns (the login
  page's logic sat next to the video player's logic) in a single dense
  file, which made it hard to find, review, or safely change one page
  without scrolling past five others. One file per concern, grouped by
  audience, mirrors how the server is already organized and scales better
  as more pages are added.
- **`invalidateQueries` over manual cache writes**: simpler and harder to
  get subtly wrong than hand-maintaining the exact shape of cached data
  after every mutation — the tradeoff is one extra network round-trip per
  mutation, which is an acceptable cost at this app's scale and request
  volume.
- **Shared query keys across pages that read the same data** (e.g.
  `admin-videos`): avoids redundant network requests when an admin
  navigates between pages that both need the video list, without any
  explicit cross-page coordination — this falls out of React Query's cache
  keying naturally.

## Test cases

See [`docs/testing/03-frontend-automated-tests.md`](../testing/03-frontend-automated-tests.md):
`Status` renders loading, error, and empty states correctly given each prop
combination (`client/src/components/Status.test.jsx`). Broader coverage of
data-fetching behavior (cache invalidation actually refetching, mutations
actually updating the UI) is currently only exercised manually/end-to-end —
see [`docs/testing/00-test-strategy-and-tooling.md`](../testing/00-test-strategy-and-tooling.md).

## What further can be done

- **Component tests for the data-driven pages** (Videos, Questions,
  Assignments, Reports, Player) using a `QueryClientProvider` test harness
  and a mocked Axios instance — today only `Status` and `LoginPage` have
  automated tests; the rest are covered by the manual E2E test plans.
- **A shared `useAdminVideos()`/`useLearners()` etc. hook layer** to remove
  the repeated `useQuery({ queryKey: [...], queryFn: () => api.get(...) })`
  boilerplate across pages, once there are enough call sites to justify the
  abstraction.
- **Optimistic updates** for low-risk mutations (e.g. publish/unpublish)
  instead of waiting for a refetch after `invalidateQueries`.

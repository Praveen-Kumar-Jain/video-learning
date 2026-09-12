# Frontend future work

This consolidates the "what further can be done" sections scattered across
the feature docs, prioritized roughly by likely impact.

## High impact

1. **Component-level automated tests** for every data-driven page (Videos,
   Questions, Assignments, Reports, Player) — today only `Status` and
   `LoginPage` have automated coverage; everything else relies on the
   manual E2E test plans. See
   [08-shared-components-and-data-fetching.md](08-shared-components-and-data-fetching.md)
   and
   [`docs/testing/00-test-strategy-and-tooling.md`](../testing/00-test-strategy-and-tooling.md).
2. **A global 401 handler** that forces logout/redirect on any expired/
   invalid token, instead of each page surfacing it as a generic error — see
   [01-routing-and-auth-guarding.md](01-routing-and-auth-guarding.md).
3. **Server-authoritative completion** would need a corresponding frontend
   change (the player would report raw watch events instead of computing/
   asserting its own percentage) — see
   [07-learner-player-page.md](07-learner-player-page.md).

## Medium impact

4. **Charts/visual summaries and CSV export** on the Reports page — see
   [05-admin-reports-page.md](05-admin-reports-page.md).
5. **Reordering/visual timestamp picking** in the question editor — see
   [03-admin-questions-page.md](03-admin-questions-page.md).
6. **Thumbnails on the learner home page** (data already exists, just isn't
   rendered there yet) — see [06-learner-home-page.md](06-learner-home-page.md).
7. **Bulk assignment UI**, once the backend supports it — see
   [04-admin-assignments-page.md](04-admin-assignments-page.md).
8. **A styled confirm dialog** for destructive actions instead of native
   `window.confirm` — see [02-admin-videos-page.md](02-admin-videos-page.md).
9. **Accessibility pass on the quiz modal** (focus trap, escape-to-close) —
   see [07-learner-player-page.md](07-learner-player-page.md).

## Lower impact / polish

10. **Design tokens** (CSS custom properties) for the color palette — see
    [09-styling-and-design-system.md](09-styling-and-design-system.md).
11. **Search/filter/sort** on the Videos and Assignments list screens once
    the catalog grows.
12. **Deep-link preservation** through the login redirect — see
    [01-routing-and-auth-guarding.md](01-routing-and-auth-guarding.md).
13. **A shared data-fetching hook layer** to reduce `useQuery`/`useMutation`
    boilerplate repetition across pages — see
    [08-shared-components-and-data-fetching.md](08-shared-components-and-data-fetching.md).
14. **Dark mode**, if ever needed.

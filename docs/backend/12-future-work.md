# Backend future work

This consolidates the "what further can be done" sections scattered across
the feature docs, prioritized roughly by likely impact.

## High impact

1. **Real video file upload** (multer + local or object storage, server-side
   duration probing). Explicitly scoped out of this pass in favor of
   URL-only entry — see [03-videos-feature.md](03-videos-feature.md) and the
   top-level `docs/IMPLEMENTATION-SO-FAR.md`.
2. **Server-authoritative progress/completion**, instead of trusting
   client-reported `completionPercentage`/`status` — see
   [06-progress-and-playback.md](06-progress-and-playback.md). Matters most
   if this is ever used for compliance-style "must complete" training.
3. **MongoDB-backed integration tests** (e.g. `mongodb-memory-server`)
   exercising full request/response cycles against a real database, rather
   than the current auth-boundary-only route tests — see
   [`docs/testing/00-test-strategy-and-tooling.md`](../testing/00-test-strategy-and-tooling.md)
   for why this was deliberately deferred and what it would look like.

## Medium impact

4. **Cascade cleanup of orphaned `Progress`/`Response`** on video deletion
   (today only `Question`/`Assignment` are cascaded — see
   [03-videos-feature.md](03-videos-feature.md)).
5. **CSV/aggregate/cross-video reporting**, charts, and pagination — see
   [08-reports-feature.md](08-reports-feature.md).
6. **Bulk assignment** to a cohort of learners in one call — see
   [05-assignments-feature.md](05-assignments-feature.md).
7. **Partial credit and fuzzy short-answer matching** for grading — see
   [07-responses-and-grading.md](07-responses-and-grading.md).
8. **Refresh tokens, password reset, login rate limiting** — see
   [01-authentication.md](01-authentication.md).
9. **A third role (e.g. manager)** and/or per-video admin ownership — see
   [02-authorization-and-roles.md](02-authorization-and-roles.md).

## Lower impact / operational

10. **Docker Compose** for a one-command app + MongoDB local setup.
11. **CI pipeline** running lint/format-check/tests/build on every push.
12. **OpenAPI spec linting in CI**, and/or generating a typed frontend client
    from it — see [11-api-docs-and-seed-data.md](11-api-docs-and-seed-data.md).
13. **Content versioning** so editing a published lesson's questions doesn't
    retroactively change what a learner "answered" historically — see
    [03-videos-feature.md](03-videos-feature.md).
14. **Soft deletes** across the board instead of hard deletes — see
    [10-database-schema.md](10-database-schema.md).
15. **Structured error codes** in API error responses, distinct from the
    human-readable message — see
    [09-validation-and-error-handling.md](09-validation-and-error-handling.md).

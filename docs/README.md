# Documentation index

This project's documentation is split by audience:

- **[`docs/backend/`](backend/)** — 13 docs, one per backend feature/concern.
  Each covers what was built, how it works, why it was built that way, and
  what further could be done. Start at
  [`backend/00-overview-and-architecture.md`](backend/00-overview-and-architecture.md).
- **[`docs/frontend/`](frontend/)** — 11 docs, one per frontend page/concern,
  in the same what/how/why/next format. Start at
  [`frontend/00-overview-and-architecture.md`](frontend/00-overview-and-architecture.md).
- **[`docs/testing/`](testing/)** — 8 docs forming the complete test plan:
  the current automated suites, a full manual API test matrix (positive,
  negative, and boundary cases per endpoint), step-by-step end-to-end flows
  for both admin and learner, cross-cutting edge cases, and a release-gate
  checklist. Start at
  [`testing/00-test-strategy-and-tooling.md`](testing/00-test-strategy-and-tooling.md).

## Top-level docs (pre-existing, kept for quick reference)

- [`../README.md`](../README.md) — setup and quick start.
- [`../STARTUP.md`](../STARTUP.md) — first-time setup and a condensed
  end-to-end checklist.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — one-page request/playback flow
  summary.
- [`IMPLEMENTATION-SO-FAR.md`](IMPLEMENTATION-SO-FAR.md) — condensed status
  summary (superseded in detail by `docs/backend/` and `docs/frontend/`).
- [`TEST-PLAN.md`](TEST-PLAN.md) — condensed test summary (superseded in
  detail by `docs/testing/`).

## How these relate

The top-level docs are short, high-level summaries meant for a first-time
reader or a quick refresh. The `backend/`, `frontend/`, and `testing/`
folders are the detailed reference: each doc is self-contained, links to the
exact source files it describes, and cross-links to related docs (e.g. a
frontend page doc links to the backend route doc it calls, and to the test
plan sections that cover it).

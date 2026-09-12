# Regression checklist and release gate

A condensed checklist to run before considering a change complete or shipping
a release. Each line links back to the detailed test plan it summarizes.

## Automated (must be green)

- [ ] `npm run test --workspace server` — see [01-backend-automated-tests.md](01-backend-automated-tests.md)
- [ ] `npm run test --workspace client` — see [03-frontend-automated-tests.md](03-frontend-automated-tests.md)
- [ ] `npm run build --workspace client` — compiles with no errors
- [ ] `npm run format:check` — no formatting drift

## Manual smoke test (run at least once per release)

- [ ] Fresh `npm run seed --workspace server` completes without error
- [ ] Admin login → Videos shows all 6 seeded courses, one marked `Draft`
- [ ] Create, edit, publish, and delete a video (with confirm) —
      [04-e2e-admin-flow-test-plan.md § B](04-e2e-admin-flow-test-plan.md)
- [ ] Create a single-choice question with a correct answer marked, edit it,
      delete it — [04-e2e-admin-flow-test-plan.md § D](04-e2e-admin-flow-test-plan.md)
- [ ] Assign a video to a learner, then remove the assignment —
      [04-e2e-admin-flow-test-plan.md § C](04-e2e-admin-flow-test-plan.md)
- [ ] Reports page shows correct progress and graded responses for a seeded
      course — [04-e2e-admin-flow-test-plan.md § E](04-e2e-admin-flow-test-plan.md)
- [ ] Learner login (`learner@example.com`) → My learning shows one
      not-started, one in-progress, one completed card —
      [05-e2e-learner-flow-test-plan.md § A](05-e2e-learner-flow-test-plan.md)
- [ ] Play a lesson: pause-at-timestamp for all three question types,
      progress resume after refresh, completion at the end —
      [05-e2e-learner-flow-test-plan.md § B-D](05-e2e-learner-flow-test-plan.md)
- [ ] `GET http://localhost:5000/api/docs` renders Swagger UI with all route
      groups listed

## Before merging a change to a specific area

| Area changed | Re-run at minimum |
| --- | --- |
| Auth/roles | [02-backend-api-manual-test-cases.md § Auth](02-backend-api-manual-test-cases.md), § Authorization edge cases in [06-edge-cases-and-negative-scenarios.md](06-edge-cases-and-negative-scenarios.md) |
| Videos | [02 § Videos](02-backend-api-manual-test-cases.md), [04-e2e-admin-flow-test-plan.md § B](04-e2e-admin-flow-test-plan.md) |
| Questions / grading | [02 § Questions](02-backend-api-manual-test-cases.md), `grading.test.js`, [04 § D](04-e2e-admin-flow-test-plan.md), [05 § C](05-e2e-learner-flow-test-plan.md) |
| Assignments | [02 § Assignments](02-backend-api-manual-test-cases.md), [04 § C](04-e2e-admin-flow-test-plan.md) |
| Progress/playback | [02 § Playback and progress](02-backend-api-manual-test-cases.md), [05 § B, D](05-e2e-learner-flow-test-plan.md) |
| Responses | [02 § Responses](02-backend-api-manual-test-cases.md), [05 § C, F](05-e2e-learner-flow-test-plan.md) |
| Reports | [02 § Reports](02-backend-api-manual-test-cases.md), [04 § E](04-e2e-admin-flow-test-plan.md) |
| Seed data | [`docs/backend/11-api-docs-and-seed-data.md`](../backend/11-api-docs-and-seed-data.md), full manual smoke test above |
| Styling only | Visual check across § B-E of both E2E plans at desktop and mobile width |

## Known-deferred (not blocking, tracked as future work)

See [`docs/backend/12-future-work.md`](../backend/12-future-work.md) and
[`docs/frontend/10-future-work.md`](../frontend/10-future-work.md) for the
full list. Notably **not** currently covered by any automated test and worth
extra manual attention on any related change:
- Server-authoritative progress/completion (client-reported values are
  trusted).
- Cascading cleanup of `Progress`/`Response` on video deletion (only
  `Question`/`Assignment` currently cascade).
- Concurrent-edit conflicts (last write wins, no locking).

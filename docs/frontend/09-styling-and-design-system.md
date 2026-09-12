# Styling and design system

Source: [`client/src/styles.css`](../../client/src/styles.css).

## What was built

One plain CSS file, no framework or CSS-in-JS, covering the whole app: layout
primitives (`main`, `.card`, `.row`, `.page-title`, `.form-grid`), form
controls, buttons (`.secondary`, `.danger`), status pills/badges, tables, the
video player/quiz modal, and a single mobile breakpoint.

## How it works

The stylesheet is organized as a flat set of reusable utility-ish classes
rather than one class per component:

- **Layout**: `.card` (white panel, border, shadow) is the single visual
  container used everywhere — forms, list rows, report sections all render
  inside one or more `.card`s. `.row` and `.page-title` are flex-layout
  helpers for the common "content on the left, action(s) on the right"
  pattern that recurs across nearly every list screen.
- **Buttons**: a bare `button`/`.button` is the primary (blue) style;
  `.secondary` (muted) and `.danger` (red, added in this pass for delete
  actions) are modifier classes layered on top of the same base rules.
- **Status/feedback**: `.pill` (neutral) and `.pill.live` (green, "published"/
  "completed") are reused for both video-publish state and the Reports
  page's progress-status column. `.badge.correct`/`.badge.incorrect` (added
  in this pass) follow the same green/red convention for the responses
  report, so "good/positive state" and "bad/negative state" always mean the
  same two colors everywhere in the app.
- **Tables** (`table`/`th`/`td`, added in this pass for the Reports page) use
  a plain bordered-row style consistent with the rest of the app's flat,
  card-based look, rather than introducing a separate visual language for
  tabular data.
- **The question-editor option rows** (`.option-row`, `.options-label`,
  added in this pass) use a 3-column grid (checkbox/radio, text input,
  remove button) that collapses to 2 columns on the mobile breakpoint (the
  remove button wraps below).

## Why it works this way

- **Plain CSS, no framework**: the whole app is small enough that a
  component library (Tailwind, MUI, etc.) would add more setup/learning
  overhead than it would save, and a single readable stylesheet keeps the
  entire visual language auditable in one file.
- **A handful of reused container/status classes (`.card`, `.pill`, `.badge`)
  instead of bespoke per-page classes**: every new page added in this pass
  (Reports) reused `.card`, `.page-title`, `.pill`, and introduced only the
  genuinely new patterns it needed (`table`, `.badge`) — keeping the total
  number of classes small and every class meaningfully reused rather than
  accumulating one-off, single-use styles.
- **Consistent green/red semantics** (`.live`/`.badge.correct` = green,
  `.danger`/`.badge.incorrect` = red) across unrelated features (publish
  state, progress status, answer correctness): a user who's learned "green
  means good, red means bad/destructive" in one part of the app doesn't have
  to relearn the convention in another.
- **One mobile breakpoint (650px), not a full responsive grid system**:
  the app's layouts are simple enough (mostly single-column card lists and
  two-column forms) that one breakpoint collapsing multi-column layouts to
  one column covers the actual usage pattern without over-engineering a
  responsive system this app doesn't need.

## Test cases

Styling has no automated tests (it's not meaningfully unit-testable); see
[`docs/testing/04-e2e-admin-flow-test-plan.md`](../testing/04-e2e-admin-flow-test-plan.md)
and
[`docs/testing/05-e2e-learner-flow-test-plan.md`](../testing/05-e2e-learner-flow-test-plan.md)
for the manual visual checks folded into each flow (status pill/badge colors
match expected state, forms remain usable at a mobile viewport width, the
question-editor option rows don't overflow on narrow screens).

## What further can be done

- **A small design-token layer** (CSS custom properties for the core colors/
  spacing already used ad hoc, e.g. `#2759c9` for primary blue,
  `#086c34`/`#b42318` for success/danger) so the palette lives in one place
  instead of being repeated as literal hex values across the stylesheet.
- **Dark mode**, if ever needed — nothing in the current approach precludes
  it, but no groundwork (tokens, `prefers-color-scheme` handling) exists yet.
- **Component-level style isolation** (CSS modules or similar) if the app
  grows enough that a single global stylesheet becomes hard to navigate.

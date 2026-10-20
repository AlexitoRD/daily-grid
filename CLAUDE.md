# Daily Grid

A static site of daily puzzle games. Everyone gets the same puzzle each day,
generated from a date-based seed. No backend; per-visitor data uses
localStorage.

## Commands

- `npm run dev` / `build` / `preview`
- `npm run lint`, `npm run check`, `npm run test:coverage`, `npm run test:e2e`
- All four checks must pass before you open a PR.
- `npm run format` fixes Prettier formatting.

## Structure

- `src/lib/` shared utilities (`daily-seed.ts`: `dateKey`, `seedFromKey`,
  `createRng`)
- `src/games/<name>/` one folder per game: `logic.ts`, `logic.test.ts`, UI
  component
- `src/pages/` one route per page; games live at `/games/<name>`
- `e2e/` Playwright tests

## Rules

- Game logic is pure TypeScript with no DOM access, so it can be unit tested.
- All randomness goes through `createRng(seedFromKey(dateKey(date)))`. Never
  `Math.random()`.
- Every new function gets unit tests. Every new page gets an e2e smoke test.
- Keep coverage at or above the thresholds in `vitest.config.ts`. Never lower
  them.
- Accessible by default: keyboard playable, labelled controls, no colour-only
  meaning.
- Do not edit anything in `.github/`, `CLAUDE.md`, or `vitest.config.ts`
  thresholds.
- Do not add dependencies unless the issue allows it; say why in the PR if you
  do.
- Keep PRs to the scope of the issue. Note follow-up ideas in the PR
  description.

## Pull requests

- Title: the issue title. Body: `Closes #<n>`, a summary, how it was tested,
  and anything you were unsure about.

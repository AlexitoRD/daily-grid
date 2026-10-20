# Games

Each game lives in its own folder: `src/games/<name>/`.

```
src/games/<name>/
  logic.ts         # game rules, pure TypeScript, no DOM access
  logic.test.ts    # unit tests, next to the code
  <Name>.tsx       # UI component (React island), kept separate from the logic
```

The page for a game lives at `src/pages/games/<name>.astro`, which serves it at
`/games/<name>`.

## Rules

- Keep the logic pure so it can be unit tested. The UI component calls into it.
- All randomness comes from `createRng(seedFromKey(dateKey(date)))` in
  `src/lib/daily-seed.ts`, so everyone gets the same puzzle each day. Never use
  `Math.random()`.
- Coverage counts everything in this folder, so test the logic thoroughly.

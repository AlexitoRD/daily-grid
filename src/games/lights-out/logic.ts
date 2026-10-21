import { createRng, dateKey, seedFromKey } from '../../lib/daily-seed';

export const SIZE = 5;
export const CELLS = SIZE * SIZE;

// Row-major: cell (row, col) is at index row * SIZE + col. true means on.
export type Grid = readonly boolean[];

export function emptyGrid(): Grid {
  return Array.from({ length: CELLS }, () => false);
}

// The cell itself plus its up, down, left and right neighbours on the board.
export function affectedCells(index: number): number[] {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const cells = [index];
  if (row > 0) cells.push(index - SIZE);
  if (row < SIZE - 1) cells.push(index + SIZE);
  if (col > 0) cells.push(index - 1);
  if (col < SIZE - 1) cells.push(index + 1);
  return cells;
}

export function press(grid: Grid, index: number): Grid {
  const next = [...grid];
  for (const cell of affectedCells(index)) next[cell] = !next[cell];
  return next;
}

export function applyPresses(grid: Grid, presses: readonly number[]): Grid {
  return presses.reduce(press, grid);
}

export function isSolved(grid: Grid): boolean {
  return grid.every((on) => !on);
}

// Picks 8 to 12 distinct cells to press. Pressing them on an all-off grid
// makes a puzzle that pressing the same cells again solves.
export function randomPresses(rng: () => number): number[] {
  const cells = Array.from({ length: CELLS }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const count = 8 + Math.floor(rng() * 5);
  return cells.slice(0, count);
}

// Builds a puzzle from random presses. Some sets of presses cancel out, so
// keep pressing until at least one light is on.
export function generatePuzzle(rng: () => number): Grid {
  let grid = applyPresses(emptyGrid(), randomPresses(rng));
  while (isSolved(grid)) grid = press(grid, Math.floor(rng() * CELLS));
  return grid;
}

export function dailyPuzzle(date: Date): Grid {
  return generatePuzzle(createRng(seedFromKey(dateKey(date))));
}

// Where focus goes when an arrow key is pressed on a cell. Stops at the edges.
// Returns null for keys that do not move focus.
export function moveIndex(index: number, key: string): number | null {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  switch (key) {
    case 'ArrowUp':
      return Math.max(row - 1, 0) * SIZE + col;
    case 'ArrowDown':
      return Math.min(row + 1, SIZE - 1) * SIZE + col;
    case 'ArrowLeft':
      return row * SIZE + Math.max(col - 1, 0);
    case 'ArrowRight':
      return row * SIZE + Math.min(col + 1, SIZE - 1);
    default:
      return null;
  }
}

export interface GameState {
  start: Grid;
  grid: Grid;
  moves: number;
  // The cell that is in the tab order (roving tabindex)
  focus: number;
}

export type GameAction =
  | { type: 'press'; index: number }
  | { type: 'focus'; index: number }
  | { type: 'reset' };

export function initGame(start: Grid): GameState {
  return { start, grid: start, moves: 0, focus: 0 };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'press':
      // The board is locked once solved; Reset starts again.
      if (isSolved(state.grid)) return { ...state, focus: action.index };
      return {
        ...state,
        grid: press(state.grid, action.index),
        moves: state.moves + 1,
        focus: action.index,
      };
    case 'focus':
      return { ...state, focus: action.index };
    case 'reset':
      return initGame(state.start);
  }
}

export function cellLabel(index: number, on: boolean): string {
  const row = Math.floor(index / SIZE) + 1;
  const col = (index % SIZE) + 1;
  return `Row ${row}, column ${col}, ${on ? 'on' : 'off'}`;
}

export function movesText(moves: number): string {
  return `${moves} ${moves === 1 ? 'move' : 'moves'}`;
}

// Result lines for the share text. Only the move count, so nothing about the
// puzzle or its solution is given away.
export function shareLines(moves: number): string[] {
  return [`Solved in ${movesText(moves)}`];
}

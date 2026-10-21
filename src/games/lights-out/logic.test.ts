import { describe, expect, it } from 'vitest';
import { createRng } from '../../lib/daily-seed';
import {
  affectedCells,
  applyPresses,
  CELLS,
  cellLabel,
  dailyPuzzle,
  emptyGrid,
  gameReducer,
  generatePuzzle,
  initGame,
  isSolved,
  moveIndex,
  movesText,
  press,
  randomPresses,
  SIZE,
  type Grid,
} from './logic';

const at = (row: number, col: number) => row * SIZE + col;
const onCells = (grid: Grid) =>
  grid.flatMap((on, i) => (on ? [i] : [])).sort((a, b) => a - b);

// Independent check: solve the puzzle over GF(2) with Gaussian elimination.
// Returns true if some set of presses turns every light off.
function solvable(grid: Grid): boolean {
  const rows = Array.from({ length: CELLS }, (_, cell) => {
    const row = Array.from({ length: CELLS + 1 }, () => 0);
    for (let p = 0; p < CELLS; p++) {
      if (affectedCells(p).includes(cell)) row[p] = 1;
    }
    row[CELLS] = grid[cell] ? 1 : 0;
    return row;
  });
  let pivotRow = 0;
  for (let col = 0; col < CELLS; col++) {
    const found = rows.findIndex((r, i) => i >= pivotRow && r[col] === 1);
    if (found === -1) continue;
    [rows[pivotRow], rows[found]] = [rows[found], rows[pivotRow]];
    for (let i = 0; i < CELLS; i++) {
      if (i !== pivotRow && rows[i][col] === 1) {
        rows[i] = rows[i].map((v, j) => v ^ rows[pivotRow][j]);
      }
    }
    pivotRow++;
  }
  // Inconsistent if a row has no presses but still needs a toggle.
  return !rows.some((r) => r.slice(0, CELLS).every((v) => v === 0) && r[CELLS]);
}

// A fake rng that makes randomPresses return exactly `presses` (8 to 12
// cells), then returns 0.5 forever. It drives the Fisher-Yates shuffle so the
// wanted cells end up at the front, in order.
function rngPicking(presses: number[]): () => number {
  const target = [
    ...presses,
    ...Array.from({ length: CELLS }, (_, i) => i).filter(
      (i) => !presses.includes(i),
    ),
  ];
  const cells = Array.from({ length: CELLS }, (_, i) => i);
  const values: number[] = [];
  for (let i = CELLS - 1; i > 0; i--) {
    const j = cells.indexOf(target[i]);
    [cells[i], cells[j]] = [cells[j], cells[i]];
    values.push((j + 0.5) / (i + 1));
  }
  values.push((presses.length - 8 + 0.5) / 5);
  return () => values.shift() ?? 0.5;
}

describe('emptyGrid', () => {
  it('has 25 cells, all off', () => {
    const grid = emptyGrid();
    expect(grid).toHaveLength(25);
    expect(grid.every((on) => !on)).toBe(true);
  });
});

describe('affectedCells and press', () => {
  it('toggles the cell and its four neighbours in the middle', () => {
    expect(onCells(press(emptyGrid(), at(2, 2)))).toEqual(
      [at(1, 2), at(2, 1), at(2, 2), at(2, 3), at(3, 2)].sort((a, b) => a - b),
    );
  });

  it('toggles three cells in each corner', () => {
    expect(onCells(press(emptyGrid(), at(0, 0)))).toEqual([0, 1, 5]);
    expect(onCells(press(emptyGrid(), at(0, 4)))).toEqual([3, 4, 9]);
    expect(onCells(press(emptyGrid(), at(4, 0)))).toEqual([15, 20, 21]);
    expect(onCells(press(emptyGrid(), at(4, 4)))).toEqual([19, 23, 24]);
  });

  it('toggles four cells on an edge without wrapping', () => {
    expect(onCells(press(emptyGrid(), at(0, 2)))).toEqual([1, 2, 3, 7]);
    expect(onCells(press(emptyGrid(), at(2, 0)))).toEqual([5, 10, 11, 15]);
    expect(onCells(press(emptyGrid(), at(2, 4)))).toEqual([9, 13, 14, 19]);
    expect(onCells(press(emptyGrid(), at(4, 2)))).toEqual([17, 21, 22, 23]);
  });

  it('turns lit cells off', () => {
    const lit = Array.from({ length: CELLS }, () => true);
    expect(onCells(press(lit, at(0, 0)))).not.toContain(0);
    expect(press(lit, at(0, 0)).filter((on) => !on)).toHaveLength(3);
  });

  it('does not change the original grid', () => {
    const grid = emptyGrid();
    press(grid, 12);
    expect(isSolved(grid)).toBe(true);
  });

  it('undoes itself when pressed twice', () => {
    const grid = generatePuzzle(createRng(7));
    expect(press(press(grid, 6), 6)).toEqual(grid);
  });
});

describe('applyPresses', () => {
  it('applies each press in turn', () => {
    expect(applyPresses(emptyGrid(), [0, 24])).toEqual(
      press(press(emptyGrid(), 0), 24),
    );
  });

  it('leaves the grid alone with no presses', () => {
    expect(applyPresses(emptyGrid(), [])).toEqual(emptyGrid());
  });
});

describe('isSolved', () => {
  it('is true when every light is off', () => {
    expect(isSolved(emptyGrid())).toBe(true);
  });

  it('is false when any light is on', () => {
    for (const cell of [0, 12, 24]) {
      const grid = [...emptyGrid()];
      grid[cell] = true;
      expect(isSolved(grid)).toBe(false);
    }
  });
});

describe('randomPresses', () => {
  it('picks 8 to 12 distinct cells on the board', () => {
    for (let seed = 0; seed < 200; seed++) {
      const presses = randomPresses(createRng(seed));
      expect(presses.length).toBeGreaterThanOrEqual(8);
      expect(presses.length).toBeLessThanOrEqual(12);
      expect(new Set(presses).size).toBe(presses.length);
      for (const p of presses) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThan(CELLS);
      }
    }
  });

  it('is solved by pressing the same cells again', () => {
    const presses = randomPresses(createRng(3));
    const puzzle = applyPresses(emptyGrid(), presses);
    expect(isSolved(applyPresses(puzzle, presses))).toBe(true);
  });
});

describe('generatePuzzle', () => {
  it('always has a light on and is always solvable', () => {
    for (let seed = 0; seed < 200; seed++) {
      const grid = generatePuzzle(createRng(seed));
      expect(isSolved(grid)).toBe(false);
      expect(solvable(grid)).toBe(true);
    }
  });

  it('keeps pressing when the random presses cancel out', () => {
    // Pressing these 12 cells on an empty board leaves it empty (a "quiet"
    // pattern), so the generator has to press again.
    const quiet = [0, 2, 4, 5, 7, 9, 15, 17, 19, 20, 22, 24];
    expect(isSolved(applyPresses(emptyGrid(), quiet))).toBe(true);
    expect(randomPresses(rngPicking(quiet))).toEqual(quiet);

    const grid = generatePuzzle(rngPicking(quiet));
    expect(isSolved(grid)).toBe(false);
    expect(solvable(grid)).toBe(true);
  });
});

describe('dailyPuzzle', () => {
  it('gives the same puzzle for the same date', () => {
    expect(dailyPuzzle(new Date(2026, 9, 21, 8))).toEqual(
      dailyPuzzle(new Date(2026, 9, 21, 22)),
    );
  });

  it('gives different puzzles for different dates', () => {
    const dates = Array.from(
      { length: 30 },
      (_, i) => new Date(2026, 9, i + 1),
    );
    const puzzles = new Set(dates.map((d) => onCells(dailyPuzzle(d)).join()));
    expect(puzzles.size).toBe(dates.length);
  });

  it('is solvable every day for a year', () => {
    for (let day = 0; day < 365; day++) {
      const grid = dailyPuzzle(new Date(2026, 0, 1 + day));
      expect(isSolved(grid)).toBe(false);
      expect(solvable(grid)).toBe(true);
    }
  });
});

describe('moveIndex', () => {
  it('moves one cell in each direction', () => {
    expect(moveIndex(at(2, 2), 'ArrowUp')).toBe(at(1, 2));
    expect(moveIndex(at(2, 2), 'ArrowDown')).toBe(at(3, 2));
    expect(moveIndex(at(2, 2), 'ArrowLeft')).toBe(at(2, 1));
    expect(moveIndex(at(2, 2), 'ArrowRight')).toBe(at(2, 3));
  });

  it('stops at the edges', () => {
    expect(moveIndex(at(0, 0), 'ArrowUp')).toBe(at(0, 0));
    expect(moveIndex(at(0, 0), 'ArrowLeft')).toBe(at(0, 0));
    expect(moveIndex(at(4, 4), 'ArrowDown')).toBe(at(4, 4));
    expect(moveIndex(at(4, 4), 'ArrowRight')).toBe(at(4, 4));
    // Right from the end of a row does not wrap to the next row.
    expect(moveIndex(at(1, 4), 'ArrowRight')).toBe(at(1, 4));
  });

  it('returns null for other keys', () => {
    expect(moveIndex(0, 'Enter')).toBeNull();
    expect(moveIndex(0, 'a')).toBeNull();
  });
});

describe('gameReducer', () => {
  const start = press(emptyGrid(), at(2, 2));

  it('starts with no moves and focus on the first cell', () => {
    expect(initGame(start)).toEqual({ start, grid: start, moves: 0, focus: 0 });
  });

  it('presses a cell, counts the move and focuses it', () => {
    const state = gameReducer(initGame(start), { type: 'press', index: 0 });
    expect(state.grid).toEqual(press(start, 0));
    expect(state.moves).toBe(1);
    expect(state.focus).toBe(0);
    expect(state.start).toBe(start);
  });

  it('solves the puzzle', () => {
    const state = gameReducer(initGame(start), {
      type: 'press',
      index: at(2, 2),
    });
    expect(isSolved(state.grid)).toBe(true);
    expect(state.moves).toBe(1);
  });

  it('ignores presses once solved but still moves focus', () => {
    const solved = gameReducer(initGame(start), {
      type: 'press',
      index: at(2, 2),
    });
    const after = gameReducer(solved, { type: 'press', index: 3 });
    expect(after.grid).toEqual(solved.grid);
    expect(after.moves).toBe(1);
    expect(after.focus).toBe(3);
  });

  it('moves focus without pressing', () => {
    const state = gameReducer(initGame(start), { type: 'focus', index: 9 });
    expect(state.focus).toBe(9);
    expect(state.grid).toBe(start);
    expect(state.moves).toBe(0);
  });

  it('resets to the starting grid', () => {
    let state = initGame(start);
    state = gameReducer(state, { type: 'press', index: 0 });
    state = gameReducer(state, { type: 'press', index: 24 });
    state = gameReducer(state, { type: 'reset' });
    expect(state).toEqual(initGame(start));
  });
});

describe('cellLabel', () => {
  it('names the row, column and state, counting from 1', () => {
    expect(cellLabel(at(1, 2), true)).toBe('Row 2, column 3, on');
    expect(cellLabel(0, false)).toBe('Row 1, column 1, off');
    expect(cellLabel(24, true)).toBe('Row 5, column 5, on');
  });
});

describe('movesText', () => {
  it('uses the singular for one move', () => {
    expect(movesText(1)).toBe('1 move');
  });

  it('uses the plural otherwise', () => {
    expect(movesText(0)).toBe('0 moves');
    expect(movesText(7)).toBe('7 moves');
  });
});

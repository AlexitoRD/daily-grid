import type { KeyboardEvent, MouseEvent } from 'react';
import { moveIndex, type GameAction } from './logic';

// Event handlers for the board, kept out of the component so they can be unit
// tested with plain objects. The board uses event delegation: each cell is a
// button with a data-index attribute.

function cellIndex(target: EventTarget | null): number | null {
  const cell = (target as Element | null)?.closest?.('[data-index]');
  const value = cell?.getAttribute('data-index');
  return value == null ? null : Number(value);
}

export interface BoardHandlers {
  onClick(event: MouseEvent<HTMLElement>): void;
  onKeyDown(event: KeyboardEvent<HTMLElement>): void;
  onReset(): void;
}

export function createHandlers(
  dispatch: (action: GameAction) => void,
): BoardHandlers {
  return {
    // Buttons fire click for Enter and Space too, so this covers the keyboard.
    onClick(event) {
      const index = cellIndex(event.target);
      if (index !== null) dispatch({ type: 'press', index });
    },
    onKeyDown(event) {
      const index = cellIndex(event.target);
      if (index === null) return;
      const next = moveIndex(index, event.key);
      if (next === null) return;
      event.preventDefault();
      dispatch({ type: 'focus', index: next });
      event.currentTarget
        .querySelector<HTMLElement>(`[data-index="${next}"]`)
        ?.focus();
    },
    onReset() {
      dispatch({ type: 'reset' });
    },
  };
}

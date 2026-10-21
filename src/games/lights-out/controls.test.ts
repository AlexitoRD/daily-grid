import type { KeyboardEvent, MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createHandlers } from './controls';
import type { GameAction } from './logic';

// Minimal stand-ins for DOM elements, so the handlers run without a browser.
function fakeCell(index: string | null) {
  return {
    closest: () => (index === null ? null : { getAttribute: () => index }),
  };
}

function setup() {
  const actions: GameAction[] = [];
  const handlers = createHandlers((action) => actions.push(action));
  return { actions, handlers };
}

function keyEvent(key: string, index: string | null) {
  const focus = vi.fn();
  const querySelector = vi.fn(() => ({ focus }));
  const preventDefault = vi.fn();
  const event = {
    key,
    target: fakeCell(index),
    currentTarget: { querySelector },
    preventDefault,
  } as unknown as KeyboardEvent<HTMLElement>;
  return { event, focus, querySelector, preventDefault };
}

describe('onClick', () => {
  it('presses the clicked cell', () => {
    const { actions, handlers } = setup();
    handlers.onClick({
      target: fakeCell('7'),
    } as unknown as MouseEvent<HTMLElement>);
    expect(actions).toEqual([{ type: 'press', index: 7 }]);
  });

  it('ignores clicks outside a cell', () => {
    const { actions, handlers } = setup();
    handlers.onClick({
      target: fakeCell(null),
    } as unknown as MouseEvent<HTMLElement>);
    handlers.onClick({ target: null } as unknown as MouseEvent<HTMLElement>);
    expect(actions).toEqual([]);
  });
});

describe('onKeyDown', () => {
  it('moves focus to the next cell with the arrow keys', () => {
    const { actions, handlers } = setup();
    const { event, focus, querySelector, preventDefault } = keyEvent(
      'ArrowDown',
      '2',
    );
    handlers.onKeyDown(event);
    expect(actions).toEqual([{ type: 'focus', index: 7 }]);
    expect(querySelector).toHaveBeenCalledWith('[data-index="7"]');
    expect(focus).toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
  });

  it('leaves other keys alone so Enter and Space press the button', () => {
    const { actions, handlers } = setup();
    for (const key of ['Enter', ' ', 'Tab']) {
      const { event, preventDefault } = keyEvent(key, '2');
      handlers.onKeyDown(event);
      expect(preventDefault).not.toHaveBeenCalled();
    }
    expect(actions).toEqual([]);
  });

  it('ignores keys when focus is not on a cell', () => {
    const { actions, handlers } = setup();
    const { event, preventDefault } = keyEvent('ArrowDown', null);
    handlers.onKeyDown(event);
    expect(actions).toEqual([]);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

describe('onReset', () => {
  it('resets the game', () => {
    const { actions, handlers } = setup();
    handlers.onReset();
    expect(actions).toEqual([{ type: 'reset' }]);
  });
});

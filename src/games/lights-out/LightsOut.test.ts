import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LightsOut from './LightsOut';
import { cellLabel, dailyPuzzle } from './logic';

// There is no DOM in unit tests, so this checks the rendered markup.
// Interaction is covered by controls.test.ts and the e2e tests.
const render = (date?: Date) =>
  renderToStaticMarkup(createElement(LightsOut, { date }));

describe('LightsOut', () => {
  const date = new Date(2026, 9, 21);

  it('renders a labelled button for each cell of the daily puzzle', () => {
    const html = render(date);
    const puzzle = dailyPuzzle(date);
    expect(html.match(/<button[^>]*data-index=/g)).toHaveLength(25);
    puzzle.forEach((on, i) => {
      expect(html).toContain(
        `aria-label="${cellLabel(i, on)}" aria-pressed="${on}"`,
      );
    });
  });

  it('puts only the first cell in the tab order', () => {
    const html = render(date);
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(24);
  });

  it('starts with no moves, a Reset button and no solved message', () => {
    const html = render(date);
    expect(html).toContain('>Moves: 0<');
    expect(html).toContain('>Reset</button>');
    expect(html).not.toContain('Solved');
  });

  it('uses today when no date is given', () => {
    const html = render();
    dailyPuzzle(new Date()).forEach((on, i) => {
      expect(html).toContain(`aria-label="${cellLabel(i, on)}"`);
    });
  });
});

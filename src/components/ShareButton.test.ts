import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ShareButton from './ShareButton';

// There is no DOM in unit tests, so this checks the rendered markup. What
// happens on click is covered by share.test.ts and the e2e tests.
describe('ShareButton', () => {
  const html = renderToStaticMarkup(
    createElement(ShareButton, { text: 'Daily Grid' }),
  );

  it('renders a Share button', () => {
    expect(html).toMatch(/<button type="button"[^>]*>Share<\/button>/);
  });

  it('has an empty live region for the result message', () => {
    expect(html).toMatch(/<p[^>]*role="status"[^>]*><\/p>/);
  });
});

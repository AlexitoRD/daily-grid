import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  buildShareText,
  shareDate,
  shareMessage,
  shareText,
  type ShareNavigator,
} from './share';

describe('shareMessage', () => {
  it('says Copied! after copying', () => {
    expect(shareMessage('copied')).toBe('Copied!');
  });

  it('gives a short error when sharing fails', () => {
    expect(shareMessage('failed')).toBe('Could not share. Try again.');
  });

  it('says nothing after the share sheet or cancelling it', () => {
    expect(shareMessage('shared')).toBe('');
    expect(shareMessage('cancelled')).toBe('');
  });
});

describe('shareDate', () => {
  it('formats as day, short month and year', () => {
    expect(shareDate(new Date(2026, 9, 21))).toBe('21 Oct 2026');
  });

  it('does not pad single-digit days', () => {
    expect(shareDate(new Date(2026, 0, 5))).toBe('5 Jan 2026');
  });

  it('uses the local date, not UTC', () => {
    expect(shareDate(new Date(2026, 11, 31, 23, 59, 59))).toBe('31 Dec 2026');
  });
});

describe('buildShareText', () => {
  const url = 'https://example.com/games/lights-out';

  it('puts the header, result lines and url on their own lines', () => {
    expect(
      buildShareText({
        game: 'Lights Out',
        date: new Date(2026, 9, 21),
        lines: ['Solved in 7 moves'],
        url,
      }),
    ).toBe('Daily Grid · Lights Out · 21 Oct 2026\nSolved in 7 moves\n' + url);
  });

  it('keeps several result lines in order', () => {
    const text = buildShareText({
      game: 'Test',
      date: new Date(2026, 1, 3),
      lines: ['one', 'two'],
      url,
    });
    expect(text.split('\n')).toEqual([
      'Daily Grid · Test · 3 Feb 2026',
      'one',
      'two',
      url,
    ]);
  });

  it('works with no result lines', () => {
    const text = buildShareText({
      game: 'Test',
      date: new Date(2026, 1, 3),
      lines: [],
      url,
    });
    expect(text).toBe(`Daily Grid · Test · 3 Feb 2026\n${url}`);
  });
});

describe('shareText', () => {
  const text = 'Daily Grid · Lights Out · 21 Oct 2026';
  const abort = () =>
    Object.assign(new Error('cancelled'), { name: 'AbortError' });
  let writeText: Mock;
  const clipboard = () => ({ writeText }) as unknown as Clipboard;
  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
  });

  it('uses the share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const nav: ShareNavigator = { share, clipboard: clipboard() };
    expect(await shareText(text, nav)).toBe('shared');
    expect(share).toHaveBeenCalledWith({ text });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('uses the share sheet when canShare accepts the text', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    expect(await shareText(text, { share, canShare })).toBe('shared');
    expect(canShare).toHaveBeenCalledWith({ text });
  });

  it('copies when canShare rejects the text', async () => {
    const share = vi.fn();
    const nav: ShareNavigator = {
      share,
      canShare: () => false,
      clipboard: clipboard(),
    };
    expect(await shareText(text, nav)).toBe('copied');
    expect(share).not.toHaveBeenCalled();
  });

  it('copies to the clipboard when there is no share sheet', async () => {
    const nav: ShareNavigator = { clipboard: clipboard() };
    expect(await shareText(text, nav)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(text);
  });

  it('reports cancelling the share sheet without copying', async () => {
    const nav: ShareNavigator = {
      share: vi.fn().mockRejectedValue(abort()),
      clipboard: clipboard(),
    };
    expect(await shareText(text, nav)).toBe('cancelled');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to the clipboard if the share sheet fails', async () => {
    const nav: ShareNavigator = {
      share: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
      clipboard: clipboard(),
    };
    expect(await shareText(text, nav)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(text);
  });

  it('fails if copying fails', async () => {
    const nav: ShareNavigator = {
      clipboard: clipboard(),
    };
    writeText.mockRejectedValue(new Error('denied'));
    expect(await shareText(text, nav)).toBe('failed');
  });

  it('fails if neither sharing nor the clipboard is available', async () => {
    expect(await shareText(text, {})).toBe('failed');
  });

  it('fails if the share sheet fails and there is no clipboard', async () => {
    const nav: ShareNavigator = {
      share: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
    };
    expect(await shareText(text, nav)).toBe('failed');
  });

  it('uses the global navigator by default', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    try {
      expect(await shareText(text)).toBe('copied');
      expect(writeText).toHaveBeenCalledWith(text);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

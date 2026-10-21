// Sharing a result as text. Each game supplies its own result lines; the
// header, date and link are the same for every game.

export interface ShareInput {
  // Display name, e.g. "Lights Out"
  game: string;
  date: Date;
  // The game's result, one line each. Must not reveal the puzzle.
  lines: string[];
  url: string;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// e.g. "21 Oct 2026", in the visitor's local day like dateKey. Fixed English
// month names so the text is the same whatever the browser's locale.
export function shareDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function buildShareText({ game, date, lines, url }: ShareInput): string {
  return [`Daily Grid · ${game} · ${shareDate(date)}`, ...lines, url].join(
    '\n',
  );
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

// The parts of Navigator that shareText uses, so tests can pass a fake.
export type ShareNavigator = Partial<
  Pick<Navigator, 'share' | 'canShare' | 'clipboard'>
>;

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

// The part of Window that hasCoarsePointer uses, so tests can pass a fake.
export type PointerWindow = Partial<Pick<Window, 'matchMedia'>>;

// True on touch devices, where the share sheet is the natural way to share.
// Desktop browsers may have a share sheet too, but copying suits them better.
export function hasCoarsePointer(
  win: PointerWindow | undefined = globalThis.window,
): boolean {
  return win?.matchMedia?.('(pointer: coarse)').matches ?? false;
}

// On touch devices, uses the share sheet when the browser has one. Otherwise
// copies to the clipboard. If the share sheet fails for a reason other than
// the user cancelling it, falls back to the clipboard.
export async function shareText(
  text: string,
  nav: ShareNavigator | undefined = globalThis.navigator,
  touch: boolean = hasCoarsePointer(),
): Promise<ShareResult> {
  const data = { text };
  if (touch && nav?.share && (!nav.canShare || nav.canShare(data))) {
    try {
      await nav.share(data);
      return 'shared';
    } catch (error) {
      if (isAbort(error)) return 'cancelled';
    }
  }
  if (!nav?.clipboard?.writeText) return 'failed';
  try {
    await nav.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

// What the Share button announces for each result. The share sheet gives its
// own feedback, and cancelling it needs none.
export function shareMessage(result: ShareResult): string {
  switch (result) {
    case 'copied':
      return 'Copied!';
    case 'failed':
      return 'Could not share. Try again.';
    case 'shared':
    case 'cancelled':
      return '';
  }
}

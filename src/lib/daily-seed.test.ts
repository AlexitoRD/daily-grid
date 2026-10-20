import { describe, expect, it } from 'vitest';
import { createRng, dateKey, seedFromKey } from './daily-seed';

describe('dateKey', () => {
  it('pads single-digit months and days', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('leaves two-digit months and days alone', () => {
    expect(dateKey(new Date(2026, 11, 25))).toBe('2026-12-25');
  });

  it('uses the local date, not UTC', () => {
    // Late evening local time is still the same local day.
    expect(dateKey(new Date(2026, 9, 20, 23, 59, 59))).toBe('2026-10-20');
    expect(dateKey(new Date(2026, 9, 21, 0, 0, 0))).toBe('2026-10-21');
  });
});

describe('seedFromKey', () => {
  it('matches known FNV-1a values', () => {
    expect(seedFromKey('')).toBe(0x811c9dc5);
    expect(seedFromKey('a')).toBe(0xe40c292c);
  });

  it('gives the same seed for the same key', () => {
    expect(seedFromKey('2026-10-20')).toBe(seedFromKey('2026-10-20'));
  });

  it('gives different seeds for different keys', () => {
    const keys = ['2026-10-20', '2026-10-21', '2026-11-20', '2027-10-20'];
    const seeds = new Set(keys.map(seedFromKey));
    expect(seeds.size).toBe(keys.length);
  });

  it('returns an unsigned 32-bit integer', () => {
    const seed = seedFromKey('2026-10-20');
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
  });
});

describe('createRng', () => {
  const take = (rng: () => number, n: number) =>
    Array.from({ length: n }, () => rng());

  it('gives the same sequence for the same seed', () => {
    expect(take(createRng(42), 20)).toEqual(take(createRng(42), 20));
  });

  it('gives different sequences for different seeds', () => {
    expect(take(createRng(1), 5)).not.toEqual(take(createRng(2), 5));
  });

  it('returns values in [0, 1)', () => {
    const rng = createRng(seedFromKey('2026-10-20'));
    for (const value of take(rng, 10_000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('works with seed 0 and the maximum 32-bit seed', () => {
    for (const seed of [0, 2 ** 32 - 1]) {
      const value = createRng(seed)();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

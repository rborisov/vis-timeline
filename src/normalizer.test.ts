import { describe, it, expect } from 'vitest';
import { parseBceDate, formatHistoricalYear, normalizeItem, resolveGroups } from './normalizer';
import type { RawGroupItem } from './types';

describe('parseBceDate', () => {
  it('returns null for a CE year string', () => {
    expect(parseBceDate('1066')).toBeNull();
    expect(parseBceDate('1066-10-14')).toBeNull();
    expect(parseBceDate('2024-01-01')).toBeNull();
  });

  it('parses negative year only — defaults to Jan 1', () => {
    const date = parseBceDate('-490');
    expect(date).toBeInstanceOf(Date);
    // 490 BCE: historicalYear=-490, jsYear=-490+1=-489
    expect(date!.getUTCFullYear()).toBe(-489);
    expect(date!.getUTCMonth()).toBe(0);
    expect(date!.getUTCDate()).toBe(1);
  });

  it('parses negative year with month and day', () => {
    const date = parseBceDate('-490-09-12');
    expect(date!.getUTCFullYear()).toBe(-489);
    expect(date!.getUTCMonth()).toBe(8); // September = index 8
    expect(date!.getUTCDate()).toBe(12);
  });

  it('parses BCE suffix year only', () => {
    const date = parseBceDate('490 BCE');
    expect(date).toBeInstanceOf(Date);
    expect(date!.getUTCFullYear()).toBe(-489);
  });

  it('parses BCE suffix case-insensitive', () => {
    const date = parseBceDate('490 bce');
    expect(date!.getUTCFullYear()).toBe(-489);
  });

  it('parses BCE suffix with full date', () => {
    const date = parseBceDate('490-09-12 BCE');
    expect(date!.getUTCFullYear()).toBe(-489);
    expect(date!.getUTCMonth()).toBe(8);
    expect(date!.getUTCDate()).toBe(12);
  });

  it('handles 1 BCE correctly (historicalYear=-1 → jsYear=0)', () => {
    const date = parseBceDate('-1');
    expect(date!.getUTCFullYear()).toBe(0);
  });

  it('handles 1 BCE via suffix', () => {
    const date = parseBceDate('1 BCE');
    expect(date!.getUTCFullYear()).toBe(0);
  });
});

describe('formatHistoricalYear', () => {
  it('formats jsYear=0 as 1 BCE', () => {
    const date = new Date(0);
    date.setUTCFullYear(0, 0, 1);
    expect(formatHistoricalYear(date)).toBe('1 BCE');
  });

  it('formats jsYear=-489 as 490 BCE', () => {
    const date = new Date(0);
    date.setUTCFullYear(-489, 0, 1);
    expect(formatHistoricalYear(date)).toBe('490 BCE');
  });

  it('formats a CE date', () => {
    const date = new Date(0);
    date.setUTCFullYear(1066, 9, 14);
    expect(formatHistoricalYear(date)).toBe('1066 CE');
  });
});

describe('normalizeItem', () => {
  it('throws for non-object input', () => {
    expect(() => normalizeItem('string', 0)).toThrow('Item #1 must be an object');
    expect(() => normalizeItem(null, 0)).toThrow('Item #1 must be an object');
    expect(() => normalizeItem([1, 2], 0)).toThrow('Item #1 must be an object');
  });

  it('throws when start is missing', () => {
    expect(() => normalizeItem({ content: 'test' }, 0)).toThrow('missing "start"');
  });

  it('converts CE date string to Date object', () => {
    const item = normalizeItem({ content: 'Battle of Hastings', start: '1066-10-14' }, 0);
    expect(item.start).toBeInstanceOf(Date);
    expect((item.start as Date).getUTCFullYear()).toBe(1066);
    expect((item.start as Date).getUTCMonth()).toBe(9); // October = index 9
    expect((item.start as Date).getUTCDate()).toBe(14);
    expect(item.title).toBe('1066 CE: Battle of Hastings');
  });

  it('converts negative year start to Date', () => {
    const item = normalizeItem({ content: 'Battle of Marathon', start: '-490-09-12' }, 0);
    expect(item.start).toBeInstanceOf(Date);
    expect((item.start as Date).getUTCFullYear()).toBe(-489);
  });

  it('auto-generates title for BCE start', () => {
    const item = normalizeItem({ content: 'Battle of Marathon', start: '-490' }, 0);
    expect(item.title).toBe('490 BCE: Battle of Marathon');
  });

  it('does not override an explicit title', () => {
    const item = normalizeItem({ content: 'Event', start: '-490', title: 'My Title' }, 0);
    expect(item.title).toBe('My Title');
  });

  it('converts BCE start and CE end both to Date objects', () => {
    const item = normalizeItem({ content: 'Roman Empire', start: '-27', end: '476' }, 0);
    expect(item.start).toBeInstanceOf(Date);
    expect(item.end).toBeInstanceOf(Date);
    expect((item.end as Date).getUTCFullYear()).toBe(476);
  });

  it('passes through optional fields', () => {
    const item = normalizeItem(
      { content: 'Event', start: '1066', className: 'custom', type: 'point', group: 'politics' },
      0
    );
    expect(item.className).toBe('custom');
    expect(item.type).toBe('point');
    expect(item.group).toBe('politics');
  });
});

describe('resolveGroups (auto-infer)', () => {
  it('returns undefined when no items have a group field', () => {
    const items = [
      { content: 'A', start: '1066' as const },
      { content: 'B', start: '1215' as const },
    ];
    expect(resolveGroups(items)).toBeUndefined();
  });

  it('returns undefined for an empty items list', () => {
    expect(resolveGroups([])).toBeUndefined();
  });

  it('infers groups in first-occurrence order, deduped', () => {
    const items = [
      { content: 'A', start: '1066' as const, group: 'military' as const },
      { content: 'B', start: '1215' as const, group: 'political' as const },
      { content: 'C', start: '1400' as const, group: 'military' as const },
    ];
    const groups = resolveGroups(items);
    expect(groups).toHaveLength(2);
    expect(groups![0]!.id).toBe('military');
    expect(groups![0]!.content).toBe('military');
    expect(groups![1]!.id).toBe('political');
    expect(groups![1]!.content).toBe('political');
  });

  it('handles numeric group ids', () => {
    const items = [{ content: 'A', start: '1066' as const, group: 1 }];
    const groups = resolveGroups(items);
    expect(groups).toHaveLength(1);
    expect(groups![0]!.id).toBe(1);
    expect(groups![0]!.content).toBe('1');
  });

  it('skips items without a group field', () => {
    const items = [
      { content: 'A', start: '1066' as const },
      { content: 'B', start: '1215' as const, group: 'political' as const },
    ];
    const groups = resolveGroups(items);
    expect(groups).toHaveLength(1);
    expect(groups![0]!.id).toBe('political');
  });
});

describe('resolveGroups (explicit)', () => {
  it('returns undefined for an empty rawGroups array', () => {
    expect(resolveGroups([], [])).toBeUndefined();
  });

  it('normalizes a basic group entry', () => {
    const raw: RawGroupItem[] = [{ id: 'military', content: 'Military Events' }];
    const groups = resolveGroups([], raw);
    expect(groups![0]!.id).toBe('military');
    expect(groups![0]!.content).toBe('Military Events');
  });

  it('defaults content to String(id) when omitted', () => {
    const raw: RawGroupItem[] = [{ id: 'military' }];
    const groups = resolveGroups([], raw);
    expect(groups![0]!.content).toBe('military');
  });

  it('defaults content to String(id) for numeric id', () => {
    const raw: RawGroupItem[] = [{ id: 42 }];
    const groups = resolveGroups([], raw);
    expect(groups![0]!.content).toBe('42');
  });

  it('sets showNested to true by default for groups with nestedGroups', () => {
    const raw: RawGroupItem[] = [
      { id: 'parent', nestedGroups: ['child'] },
      { id: 'child' },
    ];
    const groups = resolveGroups([], raw);
    expect(groups![0]!.showNested).toBe(true);
    expect(groups![1]!.showNested).toBeUndefined();
  });

  it('respects explicit showNested: false', () => {
    const raw: RawGroupItem[] = [
      { id: 'parent', nestedGroups: ['child'], showNested: false },
      { id: 'child' },
    ];
    const groups = resolveGroups([], raw);
    expect(groups![0]!.showNested).toBe(false);
  });

  it('passes nestedGroups through', () => {
    const raw: RawGroupItem[] = [
      { id: 'parent', nestedGroups: ['child'] },
      { id: 'child' },
    ];
    const groups = resolveGroups([], raw);
    expect(groups![0]!.nestedGroups).toEqual(['child']);
  });

  it('passes className through', () => {
    const raw: RawGroupItem[] = [{ id: 'military', className: 'highlight' }];
    const groups = resolveGroups([], raw);
    expect(groups![0]!.className).toBe('highlight');
  });

  it('throws when id is missing', () => {
    const raw = [{ content: 'No ID' }] as unknown as RawGroupItem[];
    expect(() => resolveGroups([], raw)).toThrow('Group #1 is missing "id"');
  });

  it('throws when nestedGroups references an unknown id', () => {
    const raw: RawGroupItem[] = [{ id: 'parent', nestedGroups: ['ghost'] }];
    expect(() => resolveGroups([], raw)).toThrow(
      'Group "parent" references unknown nested group "ghost"'
    );
  });

  it('throws for duplicate group ids', () => {
    const raw: RawGroupItem[] = [
      { id: 'military' },
      { id: 'military' },
    ];
    expect(() => resolveGroups([], raw)).toThrow('Duplicate group id "military"');
  });
});

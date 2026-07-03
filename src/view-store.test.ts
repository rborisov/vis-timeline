import { describe, it, expect } from 'vitest';
import { hashBlockSource, getSavedWindow, setSavedWindow } from './view-store';
import type { TimelineBlockSettings } from './settings';

describe('hashBlockSource', () => {
  it('returns the same hash for the same source', () => {
    const source = '- content: Battle of Hastings\n  start: "1066-10-14"';
    expect(hashBlockSource(source)).toBe(hashBlockSource(source));
  });

  it('returns different hashes for different source', () => {
    expect(hashBlockSource('a')).not.toBe(hashBlockSource('b'));
  });
});

describe('getSavedWindow / setSavedWindow', () => {
  it('returns undefined when nothing has been saved', () => {
    const settings: TimelineBlockSettings = {};
    expect(getSavedWindow(settings, 'notes/a.md', 'hash1')).toBeUndefined();
  });

  it('round-trips a saved window', () => {
    const settings: TimelineBlockSettings = {};
    setSavedWindow(settings, 'notes/a.md', 'hash1', { start: 100, end: 200 });
    expect(getSavedWindow(settings, 'notes/a.md', 'hash1')).toEqual({ start: 100, end: 200 });
  });

  it('keeps separate entries for different source paths', () => {
    const settings: TimelineBlockSettings = {};
    setSavedWindow(settings, 'notes/a.md', 'hash1', { start: 100, end: 200 });
    setSavedWindow(settings, 'notes/b.md', 'hash1', { start: 300, end: 400 });
    expect(getSavedWindow(settings, 'notes/a.md', 'hash1')).toEqual({ start: 100, end: 200 });
    expect(getSavedWindow(settings, 'notes/b.md', 'hash1')).toEqual({ start: 300, end: 400 });
  });

  it('keeps separate entries for different block hashes in the same note', () => {
    const settings: TimelineBlockSettings = {};
    setSavedWindow(settings, 'notes/a.md', 'hash1', { start: 100, end: 200 });
    setSavedWindow(settings, 'notes/a.md', 'hash2', { start: 300, end: 400 });
    expect(getSavedWindow(settings, 'notes/a.md', 'hash1')).toEqual({ start: 100, end: 200 });
    expect(getSavedWindow(settings, 'notes/a.md', 'hash2')).toEqual({ start: 300, end: 400 });
  });

  it('overwrites an existing saved window for the same key', () => {
    const settings: TimelineBlockSettings = {};
    setSavedWindow(settings, 'notes/a.md', 'hash1', { start: 100, end: 200 });
    setSavedWindow(settings, 'notes/a.md', 'hash1', { start: 500, end: 600 });
    expect(getSavedWindow(settings, 'notes/a.md', 'hash1')).toEqual({ start: 500, end: 600 });
  });
});

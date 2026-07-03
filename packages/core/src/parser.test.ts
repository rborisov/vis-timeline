import { describe, it, expect } from 'vitest';
import { parseBlock } from './parser';

describe('parseBlock', () => {
  it('parses a flat YAML array', () => {
    const source = `
- content: Battle of Hastings
  start: "1066-10-14"
- content: Magna Carta
  start: "1215"
`.trim();
    const result = parseBlock(source);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.content).toBe('Battle of Hastings');
    expect(result.items[1]?.start).toBe('1215');
    expect(result.options).toEqual({});
  });

  it('parses a flat JSON array', () => {
    const source = JSON.stringify([
      { content: 'Event A', start: '1066' },
      { content: 'Event B', start: '-490' },
    ]);
    const result = parseBlock(source);
    expect(result.items).toHaveLength(2);
    expect(result.options).toEqual({});
  });

  it('parses YAML object with options and items keys', () => {
    const source = `
options:
  height: 400px
  orientation: bottom
items:
  - content: Battle of Hastings
    start: "1066-10-14"
`.trim();
    const result = parseBlock(source);
    expect(result.options.height).toBe('400px');
    expect(result.options.orientation).toBe('bottom');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.content).toBe('Battle of Hastings');
  });

  it('throws for content that is neither valid YAML nor JSON', () => {
    expect(() => parseBlock('{ unclosed bracket [')).toThrow(
      'Could not parse block as YAML or JSON'
    );
  });

  it('throws for a YAML object without an items key', () => {
    const source = `
title: My Timeline
start: "1066"
`.trim();
    expect(() => parseBlock(source)).toThrow('"items" key');
  });

  it('throws for a bare scalar (YAML parses it as a string)', () => {
    expect(() => parseBlock('just a string')).toThrow();
  });

  it('parses object form with a groups array', () => {
    const source = `
groups:
  - id: military
    content: Military Events
  - id: political
    content: Political Events
items:
  - content: Battle of Hastings
    start: "1066-10-14"
    group: military
`.trim();
    const result = parseBlock(source);
    expect(result.groups).toHaveLength(2);
    expect(result.groups![0]!.id).toBe('military');
    expect(result.groups![0]!.content).toBe('Military Events');
    expect(result.groups![1]!.id).toBe('political');
  });

  it('returns groups undefined when object form has no groups key', () => {
    const source = `
options:
  height: 400px
items:
  - content: Battle of Hastings
    start: "1066-10-14"
`.trim();
    const result = parseBlock(source);
    expect(result.groups).toBeUndefined();
  });

  it('returns groups undefined for flat array form', () => {
    const source = `
- content: Battle of Hastings
  start: "1066-10-14"
  group: military
`.trim();
    const result = parseBlock(source);
    expect(result.groups).toBeUndefined();
  });

  it('parses JSON object form with groups', () => {
    const source = JSON.stringify({
      groups: [{ id: 'military', content: 'Military Events' }],
      items: [{ content: 'Battle of Hastings', start: '1066', group: 'military' }],
    });
    const result = parseBlock(source);
    expect(result.groups).toHaveLength(1);
    expect(result.groups![0]!.id).toBe('military');
  });

  it('returns empty groups array when groups key is an empty array', () => {
    const source = 'groups: []\nitems: []';
    const result = parseBlock(source);
    expect(result.groups).toEqual([]);
  });

  it('ignores non-array groups value', () => {
    const source = 'groups: "invalid"\nitems: []';
    const result = parseBlock(source);
    expect(result.groups).toBeUndefined();
  });

  it('filters out null entries in groups array', () => {
    const source = 'groups:\n  - id: military\n  - null\nitems: []';
    const result = parseBlock(source);
    expect(result.groups).toHaveLength(1);
    expect(result.groups![0]!.id).toBe('military');
  });
});

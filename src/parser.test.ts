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
});

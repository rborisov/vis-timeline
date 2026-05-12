import * as yaml from 'js-yaml';
import type { RawTimelineItem, RawGroupItem, BlockOptions, ParseResult } from './types';

export function parseBlock(source: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = yaml.load(source);
  } catch {
    try {
      parsed = JSON.parse(source);
    } catch {
      throw new Error('Could not parse block as YAML or JSON.');
    }
  }

  if (Array.isArray(parsed)) {
    return { items: parsed as RawTimelineItem[], options: {} };
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (!('items' in obj)) {
      throw new Error('Block object must have an "items" key.');
    }
    return {
      items: Array.isArray(obj.items) ? (obj.items as RawTimelineItem[]) : [],
      groups: Array.isArray(obj.groups) ? (obj.groups as RawGroupItem[]).filter(Boolean) : undefined,
      options:
        typeof obj.options === 'object' && obj.options !== null
          ? (obj.options as BlockOptions)
          : {},
    };
  }

  throw new Error('Block must be a YAML/JSON array, or an object with an "items" key.');
}

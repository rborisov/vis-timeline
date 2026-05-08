# Groups and Subgroups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add vis-timeline group and nested-group support, with auto-inference from item `group` fields and optional explicit `groups:` YAML/JSON definitions.

**Architecture:** Extend the existing `parseBlock → normalizeItem → renderTimeline` pipeline with a new `resolveGroups()` stage. Parser extracts an optional `groups` array from object-form blocks. `resolveGroups()` either auto-infers flat groups from item values (first-occurrence order) or normalizes explicit group definitions including `nestedGroups` validation. Renderer receives an optional `NormalizedGroup[]` and passes it to the vis-timeline 4-argument constructor.

**Tech Stack:** TypeScript, vis-timeline, vitest, js-yaml

---

## File Map

| File | Change |
|------|--------|
| `src/types.ts` | Add `RawGroupItem`, `NormalizedGroup`; extend `ParseResult` |
| `src/parser.ts` | Extract `groups` key from object-form blocks |
| `src/parser.test.ts` | Tests for groups extraction |
| `src/normalizer.ts` | Add `resolveGroups()`, `resolveAutoInfer()`, `resolveExplicit()` |
| `src/normalizer.test.ts` | Tests for `resolveGroups()` |
| `src/renderer.ts` | Add `groups?` param; use 4-arg constructor when groups present |
| `src/main.ts` | Import `resolveGroups`, wire into pipeline |

---

## Task 1: Add types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `RawGroupItem` and `NormalizedGroup` interfaces and update `ParseResult`**

Replace the entire contents of `src/types.ts` with:

```typescript
export interface RawTimelineItem {
  content?: string;
  start?: string | number;
  end?: string | number;
  className?: string;
  title?: string;
  type?: string;
  group?: string | number;
  [key: string]: unknown;
}

export interface NormalizedTimelineItem {
  content: string;
  start: Date | string;
  end?: Date | string;
  className?: string;
  title?: string;
  type?: string;
  group?: string | number;
}

export interface RawGroupItem {
  id: string | number;
  content?: string;
  nestedGroups?: (string | number)[];
  showNested?: boolean;
  className?: string;
}

export interface NormalizedGroup {
  id: string | number;
  content: string;
  nestedGroups?: (string | number)[];
  showNested?: boolean;
  className?: string;
}

export interface BlockOptions {
  height?: string;
  orientation?: 'top' | 'bottom' | 'both';
  stack?: boolean;
  zoomMin?: number;
  zoomMax?: number;
}

export interface ParseResult {
  items: RawTimelineItem[];
  groups?: RawGroupItem[];
  options: BlockOptions;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add RawGroupItem, NormalizedGroup types and extend ParseResult"
```

---

## Task 2: Update parser to extract groups

**Files:**
- Modify: `src/parser.ts`
- Modify: `src/parser.test.ts`

- [ ] **Step 1: Write failing parser tests for groups**

Add these tests at the end of the existing `describe('parseBlock', ...)` block in `src/parser.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/parser.test.ts
```

Expected: new tests fail with property `groups` undefined or not found.

- [ ] **Step 3: Update `src/parser.ts` to extract groups**

Update the import line to include `RawGroupItem`:

```typescript
import type { RawTimelineItem, RawGroupItem, BlockOptions, ParseResult } from './types';
```

In the object-form branch, add `groups` extraction. Replace:

```typescript
    return {
      items: Array.isArray(obj.items) ? (obj.items as RawTimelineItem[]) : [],
      options:
        typeof obj.options === 'object' && obj.options !== null
          ? (obj.options as BlockOptions)
          : {},
    };
```

With:

```typescript
    return {
      items: Array.isArray(obj.items) ? (obj.items as RawTimelineItem[]) : [],
      groups: Array.isArray(obj.groups) ? (obj.groups as RawGroupItem[]) : undefined,
      options:
        typeof obj.options === 'object' && obj.options !== null
          ? (obj.options as BlockOptions)
          : {},
    };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/parser.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: extract groups array from object-form blocks in parser"
```

---

## Task 3: Implement `resolveGroups` — auto-infer path

**Files:**
- Modify: `src/normalizer.ts`
- Modify: `src/normalizer.test.ts`

- [ ] **Step 1: Write failing auto-infer tests**

Add a new `describe` block at the end of `src/normalizer.test.ts`:

```typescript
import { parseBceDate, formatHistoricalYear, normalizeItem, resolveGroups } from './normalizer';
```

Update the import line at the top of the file to add `resolveGroups` (it's not exported yet — the test will fail to compile, which is the expected failure).

Then add at the end of the file:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/normalizer.test.ts
```

Expected: compile error — `resolveGroups` not exported from `./normalizer`.

- [ ] **Step 3: Implement `resolveGroups` and `resolveAutoInfer` in `src/normalizer.ts`**

Update the import line at the top:

```typescript
import type { RawTimelineItem, NormalizedTimelineItem, RawGroupItem, NormalizedGroup } from './types';
```

Add these functions at the end of `src/normalizer.ts`:

```typescript
export function resolveGroups(
  items: NormalizedTimelineItem[],
  rawGroups?: RawGroupItem[]
): NormalizedGroup[] | undefined {
  if (rawGroups !== undefined) {
    return resolveExplicit(rawGroups);
  }
  return resolveAutoInfer(items);
}

function resolveAutoInfer(items: NormalizedTimelineItem[]): NormalizedGroup[] | undefined {
  const seen = new Map<string | number, NormalizedGroup>();
  for (const item of items) {
    if (item.group !== undefined && !seen.has(item.group)) {
      seen.set(item.group, { id: item.group, content: String(item.group) });
    }
  }
  return seen.size > 0 ? Array.from(seen.values()) : undefined;
}

function resolveExplicit(_rawGroups: RawGroupItem[]): NormalizedGroup[] | undefined {
  throw new Error('resolveExplicit not yet implemented');
}
```

- [ ] **Step 4: Run auto-infer tests to verify they pass**

```bash
npm test -- src/normalizer.test.ts
```

Expected: all auto-infer tests pass; explicit tests not yet written so no failures there.

- [ ] **Step 5: Commit**

```bash
git add src/normalizer.ts src/normalizer.test.ts
git commit -m "feat: add resolveGroups with auto-infer path"
```

---

## Task 4: Implement `resolveGroups` — explicit path

**Files:**
- Modify: `src/normalizer.ts`
- Modify: `src/normalizer.test.ts`

- [ ] **Step 1: Write failing explicit tests**

Add a second `describe` block at the end of `src/normalizer.test.ts`:

```typescript
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
});
```

Add `RawGroupItem` to the import at the top of `src/normalizer.test.ts`:

```typescript
import type { RawGroupItem } from './types';
```

- [ ] **Step 2: Run tests to verify the explicit tests fail**

```bash
npm test -- src/normalizer.test.ts
```

Expected: explicit tests fail with "resolveExplicit not yet implemented".

- [ ] **Step 3: Implement `resolveExplicit` in `src/normalizer.ts`**

Replace the stub `resolveExplicit` function with:

```typescript
function resolveExplicit(rawGroups: RawGroupItem[]): NormalizedGroup[] | undefined {
  if (rawGroups.length === 0) return undefined;
  const ids = new Set(rawGroups.map(g => g.id));
  return rawGroups.map((g, i) => {
    if (g.id == null) {
      throw new Error(`Group #${i + 1} is missing "id".`);
    }
    if (g.nestedGroups) {
      for (const childId of g.nestedGroups) {
        if (!ids.has(childId)) {
          throw new Error(`Group "${g.id}" references unknown nested group "${childId}".`);
        }
      }
    }
    const normalized: NormalizedGroup = {
      id: g.id,
      content: g.content !== undefined ? g.content : String(g.id),
    };
    if (g.nestedGroups !== undefined) {
      normalized.nestedGroups = g.nestedGroups;
      normalized.showNested = g.showNested !== undefined ? g.showNested : true;
    } else if (g.showNested !== undefined) {
      normalized.showNested = g.showNested;
    }
    if (g.className !== undefined) normalized.className = g.className;
    return normalized;
  });
}
```

- [ ] **Step 4: Run all normalizer tests to verify they pass**

```bash
npm test -- src/normalizer.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/normalizer.ts src/normalizer.test.ts
git commit -m "feat: add resolveGroups explicit path with nestedGroups validation"
```

---

## Task 5: Update renderer to accept groups

**Files:**
- Modify: `src/renderer.ts`

- [ ] **Step 1: Update `src/renderer.ts`**

Replace the entire file with:

```typescript
import type { NormalizedTimelineItem, NormalizedGroup, BlockOptions } from './types';
import { Timeline } from 'vis-timeline/standalone';

const DEFAULT_OPTIONS: Required<BlockOptions> = {
  height: '75vh',
  orientation: 'top',
  stack: true,
  zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
  zoomMax: 1000 * 60 * 60 * 24 * 365 * 10000,
};

export function renderTimeline(
  el: HTMLElement,
  items: NormalizedTimelineItem[],
  options: BlockOptions = {},
  groups?: NormalizedGroup[]
): { destroy(): void } {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  const container = el.createEl('div');
  container.className = 'timeline-plugin';
  container.style.width = '100%';
  container.style.height = merged.height;
  container.style.minHeight = '300px';

  const TimelineConstructor = Timeline as unknown as new (
    ...args: unknown[]
  ) => { destroy(): void; redraw(): void };

  const visOptions = {
    editable: false,
    height: '100%',
    margin: { item: { horizontal: 10, vertical: 4 }, axis: 5 },
    orientation: merged.orientation,
    stack: merged.stack,
    zoomMin: merged.zoomMin,
    zoomMax: merged.zoomMax,
  };

  const tl = groups !== undefined
    ? new TimelineConstructor(container, items, groups, visOptions)
    : new TimelineConstructor(container, items, visOptions);

  // Force a redraw after the next layout pass so vis-timeline gets real
  // container dimensions. Without this, iOS renders into a zero-size box.
  requestAnimationFrame(() => tl.redraw());

  return tl;
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass (renderer has no unit tests; correctness verified at build time).

- [ ] **Step 3: Commit**

```bash
git add src/renderer.ts
git commit -m "feat: update renderer to accept and pass groups to vis-timeline"
```

---

## Task 6: Wire `resolveGroups` into `main.ts`

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Update `src/main.ts`**

Replace the entire file with:

```typescript
import { Plugin } from 'obsidian';
import { parseBlock } from './parser';
import { normalizeItem, resolveGroups } from './normalizer';
import { renderTimeline } from './renderer';
import { DEFAULT_SETTINGS, TimelineBlockSettings } from './settings';

export default class VisTimelinePlugin extends Plugin {
  settings!: TimelineBlockSettings;

  async onload() {
    await this.loadSettings();

    this.registerMarkdownCodeBlockProcessor('vis-timeline', (source, el) => {
      try {
        const { items: rawItems, groups: rawGroups, options } = parseBlock(source);
        const items = rawItems.map((item, i) => normalizeItem(item, i));
        const groups = resolveGroups(items, rawGroups);
        const tl = renderTimeline(el, items, options, groups);
        this.register(() => tl.destroy());
      } catch (e) {
        el.createEl('div', {
          text: `vis-timeline error: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire resolveGroups into vis-timeline block processor pipeline"
```

---

## Task 7: Build verification

- [ ] **Step 1: Run TypeScript type check and build**

```bash
npm run build
```

Expected: exits with code 0, produces `main.js` with no TypeScript errors.

- [ ] **Step 2: Run full test suite one final time**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit build artifact if changed**

```bash
git add main.js
git commit -m "build: rebuild with groups and subgroups support"
```

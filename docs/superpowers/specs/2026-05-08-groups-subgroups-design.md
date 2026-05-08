# Groups and Subgroups — Design Spec

**Date:** 2026-05-08
**Scope:** Add vis-timeline group and nested-group support to the vis-timeline Obsidian plugin.

---

## 1. User-Facing Syntax

### Auto-inferred groups (flat array)

When items carry a `group` field but no `groups:` section is present, groups are derived automatically. Label equals the group id. Order follows first occurrence in the item list. Subgroups are not available in this mode.

```yaml
- content: Battle of Hastings
  start: "1066-10-14"
  group: military
- content: Magna Carta
  start: "1215"
  group: political
```

### Explicit groups (object form)

A top-level `groups:` array enables full control: custom labels, CSS classes, and nested (subgroup) relationships.

```yaml
groups:
  - id: medieval
    content: Medieval Period
    nestedGroups: [military, political]
    showNested: false        # starts collapsed; default is true (expanded)
  - id: military
    content: Military Events
  - id: political
    content: Political Events
items:
  - content: Battle of Hastings
    start: "1066-10-14"
    group: military
  - content: Magna Carta
    start: "1215"
    group: political
```

### JSON equivalents

Auto-inferred (flat array):

```json
[
  { "content": "Battle of Hastings", "start": "1066-10-14", "group": "military" },
  { "content": "Magna Carta", "start": "1215", "group": "political" }
]
```

Explicit groups (object form):

```json
{
  "groups": [
    { "id": "medieval", "content": "Medieval Period", "nestedGroups": ["military", "political"], "showNested": false },
    { "id": "military", "content": "Military Events" },
    { "id": "political", "content": "Political Events" }
  ],
  "items": [
    { "content": "Battle of Hastings", "start": "1066-10-14", "group": "military" },
    { "content": "Magna Carta", "start": "1215", "group": "political" }
  ]
}
```

### Group fields

| Field          | Type                     | Required | Default       | Notes                                      |
| -------------- | ------------------------ | -------- | ------------- | ------------------------------------------ |
| `id`           | `string \| number`       | yes      | —             | Must match the `group` value on items      |
| `content`      | string                   | no       | `String(id)`  | Label shown in the group sidebar           |
| `nestedGroups` | `(string \| number)[]`   | no       | —             | IDs of child groups; makes this a parent   |
| `showNested`   | boolean                  | no       | `true`        | Whether children start expanded            |
| `className`    | string                   | no       | —             | CSS class applied to the group row         |

---

## 2. Architecture

The existing pipeline is extended with one new stage:

```
parseBlock(source)
  → { items: RawTimelineItem[], groups?: RawGroupItem[], options: BlockOptions }

rawItems.map(normalizeItem)
  → NormalizedTimelineItem[]

resolveGroups(normalizedItems, rawGroups?)
  → NormalizedGroup[] | undefined

renderTimeline(el, items, options, groups?)
  → { destroy() }
```

No stage's existing responsibility changes. Each new concern is isolated.

---

## 3. Data Model (`types.ts`)

```typescript
interface RawGroupItem {
  id: string | number;
  content?: string;
  nestedGroups?: (string | number)[];
  showNested?: boolean;
  className?: string;
}

interface NormalizedGroup {
  id: string | number;
  content: string;
  nestedGroups?: (string | number)[];
  showNested?: boolean;
  className?: string;
}

// ParseResult gains:
groups?: RawGroupItem[];
```

---

## 4. Parser (`parser.ts`)

Object-form blocks may now include a top-level `groups` key alongside `items` and `options`. If present and an array, it is returned as `groups` in `ParseResult`. If absent or not an array, `groups` is `undefined`. No structural validation at this stage.

Flat-array blocks never produce a `groups` value — auto-inference happens downstream.

---

## 5. `resolveGroups()` (`normalizer.ts`)

```typescript
export function resolveGroups(
  items: NormalizedTimelineItem[],
  rawGroups?: RawGroupItem[]
): NormalizedGroup[] | undefined
```

**Returns `undefined`** when no items carry a `group` field (no groups DataSet needed by vis-timeline).

**Auto-infer path** (no `rawGroups`):
- Walk items in order; collect unique `group` values preserving first-occurrence order.
- If none found, return `undefined`.
- Each unique value → `{ id: value, content: String(value) }`.
- No `nestedGroups` — flat rows only.

**Explicit path** (with `rawGroups`):
- Each entry must have an `id`; throw `Group #N is missing "id".` if not.
- `content` defaults to `String(id)` when omitted.
- `showNested` defaults to `true` when omitted.
- Every id listed in `nestedGroups` must exist in the groups array; throw `Group "<id>" references unknown nested group "<child-id>".` if not.
- `className` passed through as-is.

---

## 6. Renderer (`renderer.ts`)

Signature change:

```typescript
export function renderTimeline(
  el: HTMLElement,
  items: NormalizedTimelineItem[],
  options: BlockOptions,
  groups?: NormalizedGroup[]
): { destroy(): void }
```

When `groups` is defined, vis-timeline is constructed with the 4-argument form:

```typescript
new Timeline(container, items, groups, visOptions)
```

When `groups` is `undefined`, the existing 3-argument call is used unchanged.

---

## 7. Call Site (`main.ts`)

```typescript
const { items: rawItems, groups: rawGroups, options } = parseBlock(source);
const items = rawItems.map((item, i) => normalizeItem(item, i));
const groups = resolveGroups(items, rawGroups);
const tl = renderTimeline(el, items, options, groups);
```

---

## 8. Error Handling

All errors thrown by `resolveGroups()` surface through the existing `main.ts` try/catch, which renders them as `vis-timeline error: <message>` in the note — consistent with existing item validation errors.

---

## 9. Testing

New tests in `normalizer.test.ts` covering `resolveGroups()`:

- Auto-infer: items with groups → correct ids, labels, order
- Auto-infer: items without groups → `undefined`
- Auto-infer: duplicate group values → deduped, first-occurrence order preserved
- Explicit: `content` defaults to `String(id)`
- Explicit: `showNested` defaults to `true`
- Explicit: missing `id` throws
- Explicit: unknown `nestedGroups` reference throws
- Explicit: valid `nestedGroups` passes through

Parser tests in `parser.test.ts`:

- Object form with `groups:` array → `ParseResult.groups` populated
- Object form without `groups:` → `ParseResult.groups` undefined
- Flat array form → `ParseResult.groups` undefined

---

## 10. Out of Scope

- Group ordering options (alphabetical, custom `order` field) — first-occurrence is sufficient for now
- Per-group `title` (tooltip) — not a common need
- Dynamic group mutations after render

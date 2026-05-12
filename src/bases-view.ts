import { BasesView, NullValue, QueryController, TFile } from 'obsidian';
import type { BasesPropertyId, ViewOption } from 'obsidian';
import { normalizeItem, resolveGroups } from './normalizer';
import { renderTimeline } from './renderer';
import type { NormalizedTimelineItem } from './types';

const DEFAULT_START_PROP = 'note.start' as BasesPropertyId;
const DEFAULT_END_PROP = 'note.end' as BasesPropertyId;
const DEFAULT_GROUP_PROP = 'note.group' as BasesPropertyId;

export class BasesTimelineView extends BasesView {
  type = 'vis-timeline';

  private el: HTMLElement;
  private tl: { destroy(): void } | null = null;
  private fileMap = new Map<string, TFile>();

  constructor(controller: QueryController, containerEl: HTMLElement) {
    super(controller);
    this.el = containerEl;
  }

  override onDataUpdated(): void {
    this.el.empty();
    if (this.tl) {
      this.tl.destroy();
      this.tl = null;
    }
    this.fileMap.clear();

    const startProp = this.config.getAsPropertyId('startProp') ?? DEFAULT_START_PROP;
    const endProp = this.config.getAsPropertyId('endProp') ?? DEFAULT_END_PROP;
    const contentProp = this.config.getAsPropertyId('contentProp');
    const groupProp = this.config.getAsPropertyId('groupProp') ?? DEFAULT_GROUP_PROP;

    const normalized: NormalizedTimelineItem[] = [];

    for (const entry of this.data.data) {
      const startVal = entry.getValue(startProp);
      if (!startVal || startVal instanceof NullValue) continue;

      const raw: Record<string, unknown> = {
        id: entry.file.path,
        start: startVal.toString(),
        content: (() => {
          if (contentProp) {
            const v = entry.getValue(contentProp);
            if (v && !(v instanceof NullValue)) return v.toString();
          }
          return entry.file.basename;
        })(),
      };

      const vEnd = entry.getValue(endProp);
      if (vEnd && !(vEnd instanceof NullValue)) raw.end = vEnd.toString();

      const vGroup = entry.getValue(groupProp);
      if (vGroup && !(vGroup instanceof NullValue)) raw.group = vGroup.toString();

      // Read display fields by their standard vis-timeline names — no config needed
      for (const field of ['type', 'className', 'title'] as const) {
        const v = entry.getValue(`note.${field}` as BasesPropertyId);
        if (v && !(v instanceof NullValue)) raw[field] = v.toString();
      }

      try {
        const item = normalizeItem(raw, normalized.length);
        this.fileMap.set(entry.file.path, entry.file);
        normalized.push(item);
      } catch {
        // skip items whose dates cannot be parsed
      }
    }

    if (normalized.length === 0) {
      this.el.createEl('p', {
        text: 'No items found. Add a "start" property to your notes.',
        cls: 'timeline-plugin-empty',
      });
      return;
    }

    const groups = resolveGroups(normalized);
    this.tl = renderTimeline(this.el, normalized, {}, groups, (id) => {
      const file = this.fileMap.get(String(id));
      if (file) this.app.workspace.getLeaf().openFile(file);
    });
  }

  override onunload(): void {
    if (this.tl) {
      this.tl.destroy();
      this.tl = null;
    }
  }
}

export function getBasesTimelineOptions(): ViewOption[] {
  return [
    {
      type: 'property',
      key: 'startProp',
      displayName: 'Start date',
      placeholder: 'start',
    },
    {
      type: 'property',
      key: 'endProp',
      displayName: 'End date',
      placeholder: 'end (optional)',
    },
    {
      type: 'property',
      key: 'contentProp',
      displayName: 'Label',
      placeholder: 'defaults to file name',
    },
    {
      type: 'property',
      key: 'groupProp',
      displayName: 'Group',
      placeholder: 'none (optional)',
    },
  ];
}

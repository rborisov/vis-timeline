import { Plugin } from 'obsidian';
import { parseBlock } from './parser';
import { normalizeItem, resolveGroups } from './normalizer';
import { renderTimeline } from './renderer';
import { DEFAULT_SETTINGS, TimelineBlockSettings } from './settings';
import { BasesTimelineView, getBasesTimelineOptions } from './bases-view';
import { resolveImageSrc, buildImageContent } from './image';

export default class VisTimelinePlugin extends Plugin {
  settings!: TimelineBlockSettings;

  async onload() {
    await this.loadSettings();

    this.registerBasesView('vis-timeline', {
      name: 'Timeline',
      icon: 'lucide-calendar-range',
      factory: (controller, containerEl) => new BasesTimelineView(controller, containerEl),
      options: getBasesTimelineOptions,
    });

    this.registerMarkdownCodeBlockProcessor('vis-timeline', (source, el) => {
      try {
        const { items: rawItems, groups: rawGroups, options } = parseBlock(source);
        const items = rawItems.map((item, i) => normalizeItem(item, i));
        for (const item of items) {
          if (item.image) {
            const src = resolveImageSrc(item.image, this.app);
            if (src) item.content = buildImageContent(item.content, src);
          }
        }
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<TimelineBlockSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

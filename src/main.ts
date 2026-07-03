import { MarkdownRenderChild, Plugin } from 'obsidian';
import { parseBlock } from './parser';
import { normalizeItem, resolveGroups } from './normalizer';
import { renderTimeline } from './renderer';
import { rasterize } from './rasterize';
import { hashBlockSource, getSavedWindow, setSavedWindow } from './view-store';
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

    this.registerMarkdownCodeBlockProcessor('vis-timeline', (source, el, ctx) => {
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

        const blockHash = hashBlockSource(source);
        const saved = getSavedWindow(this.settings, ctx.sourcePath, blockHash);
        if (saved) {
          try {
            tl.setWindow(saved.start, saved.end);
          } catch {
            // Malformed saved data — fall back to the default view.
          }
        }

        if (el.closest('[data-pubobs-render]')) {
          void rasterize(el, tl);
          return;
        }

        const child = new MarkdownRenderChild(el);
        child.onunload = () => {
          try {
            const window_ = tl.getWindow();
            setSavedWindow(this.settings, ctx.sourcePath, blockHash, {
              start: +window_.start,
              end: +window_.end,
            });
            void this.saveSettings().catch((err) => {
              console.error('vis-timeline: failed to save timeline view', err);
            });
          } catch (err) {
            console.error('vis-timeline: failed to read timeline view for saving', err);
          } finally {
            tl.destroy();
          }
        };
        ctx.addChild(child);
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

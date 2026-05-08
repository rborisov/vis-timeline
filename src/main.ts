import { Plugin } from 'obsidian';
import { parseBlock } from './parser';
import { normalizeItem } from './normalizer';
import { renderTimeline } from './renderer';
import { DEFAULT_SETTINGS, TimelineBlockSettings } from './settings';

export default class VisTimelinePlugin extends Plugin {
  settings!: TimelineBlockSettings;

  async onload() {
    await this.loadSettings();

    this.registerMarkdownCodeBlockProcessor('vis-timeline', async (source, el) => {
      try {
        const { items: rawItems, options } = parseBlock(source);
        const items = rawItems.map((item, i) => normalizeItem(item, i));
        await renderTimeline(el, items, options);
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

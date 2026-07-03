import type { App } from 'obsidian';
import type { NormalizedTimelineItem, NormalizedGroup, BlockOptions } from './types';
import { renderTimeline } from './renderer';
import { addSaveSnapshotButton } from './save-snapshot';

// Debug aid: autoHeight is only ever used in the pubobs export path, so it's
// never been visible in the interactive UI to check. This button renders a
// second, autoHeight:true instance right in Obsidian so it can be inspected
// and snapshot-tested directly, without pubobs's offscreen container in the
// way — same idea as save-snapshot.ts, one level up.
export function addAutoHeightPreviewButton(
  el: HTMLElement,
  items: NormalizedTimelineItem[],
  options: BlockOptions,
  groups: NormalizedGroup[] | undefined,
  app: App,
  sourcePath: string
): void {
  const button = el.createEl('button', {
    text: '🔍 Preview export layout',
    cls: 'tl-debug-preview-btn',
  });
  button.addEventListener('click', () => {
    button.remove();
    const wrapper = el.createEl('div', { cls: 'tl-debug-preview-wrapper' });
    renderTimeline(wrapper, items, options, groups, undefined, true);
    addSaveSnapshotButton(wrapper, app, sourcePath);
  });
}

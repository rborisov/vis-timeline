import { Notice, type App } from 'obsidian';
import type { NormalizedTimelineItem, NormalizedGroup, BlockOptions } from './types';
import { renderTimeline } from './renderer';
import { addSaveSnapshotButton, captureAndSave } from './save-snapshot';

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

  addOffscreenReplicaButton(el, items, options, groups, app, sourcePath);
}

// Debug aid: replicates pubobs's actual offscreen container CSS exactly
// (position:absolute; left:-9999px; top:-9999px; width:800px;
// visibility:hidden; appended to document.body) from within this plugin,
// so it can be tested without pubobs's own MarkdownRenderer.render() /
// asset-rewriting pipeline in the way. Both the normal interactive render
// and the autoHeight-mode render have already tested clean directly in the
// visible UI — this isolates whether the offscreen/hidden positioning
// itself is what's different in the real pubobs pipeline.
function addOffscreenReplicaButton(
  el: HTMLElement,
  items: NormalizedTimelineItem[],
  options: BlockOptions,
  groups: NormalizedGroup[] | undefined,
  app: App,
  sourcePath: string
): void {
  const button = el.createEl('button', {
    text: '🧪 Test pubobs-like offscreen render',
    cls: 'tl-debug-preview-btn',
  });
  button.addEventListener('click', () => {
    void testOffscreenReplica(items, options, groups, app, sourcePath, button);
  });
}

async function testOffscreenReplica(
  items: NormalizedTimelineItem[],
  options: BlockOptions,
  groups: NormalizedGroup[] | undefined,
  app: App,
  sourcePath: string,
  button: HTMLButtonElement
): Promise<void> {
  button.disabled = true;
  const container = activeDocument.createElement('div');
  container.addClass('tl-offscreen-replica');
  activeDocument.body.appendChild(container);
  try {
    renderTimeline(container, items, options, groups, undefined, true);
    const timelineEl = container.querySelector<HTMLElement>('.timeline-plugin');
    if (!timelineEl) throw new Error('timeline container not found');
    await captureAndSave(timelineEl, app, sourcePath);
  } catch (e) {
    console.error('vis-timeline: offscreen replica test failed', e);
    new Notice('Offscreen replica test failed — see console for details');
  } finally {
    activeDocument.body.removeChild(container);
    button.disabled = false;
  }
}

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

  // Two variants to isolate which specific CSS property matters: pubobs's
  // exact container (offscreen position + visibility:hidden together), and
  // offscreen position alone (still painted, just off the visible viewport)
  // — the normal render and autoHeight preview above already tested clean
  // when fully visible, so this narrows down what "offscreen" contributes.
  addOffscreenReplicaButton(
    el, items, options, groups, app, sourcePath,
    '🧪 Test pubobs-like offscreen render (hidden)', 'tl-offscreen-replica-hidden'
  );
  addOffscreenReplicaButton(
    el, items, options, groups, app, sourcePath,
    '🧪 Test offscreen render (visible, not hidden)', 'tl-offscreen-replica-visible'
  );
}

// Debug aid: replicates an offscreen container from within this plugin, so
// it can be tested without pubobs's own MarkdownRenderer.render() /
// asset-rewriting pipeline in the way. cssClass selects which variant (see
// styles.css): pubobs's exact CSS (offscreen + visibility:hidden), or
// offscreen position alone without hiding it.
function addOffscreenReplicaButton(
  el: HTMLElement,
  items: NormalizedTimelineItem[],
  options: BlockOptions,
  groups: NormalizedGroup[] | undefined,
  app: App,
  sourcePath: string,
  label: string,
  cssClass: string
): void {
  const button = el.createEl('button', {
    text: label,
    cls: 'tl-debug-preview-btn',
  });
  button.addEventListener('click', () => {
    void testOffscreenReplica(items, options, groups, app, sourcePath, cssClass, button);
  });
}

async function testOffscreenReplica(
  items: NormalizedTimelineItem[],
  options: BlockOptions,
  groups: NormalizedGroup[] | undefined,
  app: App,
  sourcePath: string,
  cssClass: string,
  button: HTMLButtonElement
): Promise<void> {
  button.disabled = true;
  const container = activeDocument.createElement('div');
  container.addClass(cssClass);
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

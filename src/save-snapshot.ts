import { Notice, type App } from 'obsidian';
import { capturePng } from './rasterize';

// Manual test aid: lets you capture the interactive widget exactly as
// html-to-image would for pubobs, without pubobs's offscreen container or
// timing in the way — the button only appears once you can already see the
// widget looks right, so "is it ready yet" isn't a question here.
export function addSaveSnapshotButton(el: HTMLElement, app: App, sourcePath: string): void {
  const button = el.createEl('button', {
    text: '📷 Save snapshot',
    cls: 'tl-save-snapshot-btn',
  });
  button.addEventListener('click', () => {
    void saveSnapshot(el, app, sourcePath, button);
  });
}

async function saveSnapshot(el: HTMLElement, app: App, sourcePath: string, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  try {
    // Capture only the timeline container, not `el` itself — `el` also
    // contains this button, which would otherwise show up in the image.
    const container = el.querySelector<HTMLElement>('.timeline-plugin');
    if (!container) throw new Error('timeline container not found');

    const { dataUrl } = await capturePng(container);
    const path = await getUniqueImagePath(app, sourcePath);
    await app.vault.createBinary(path, dataUrlToArrayBuffer(dataUrl));
    new Notice(`Saved timeline snapshot to ${path}`);
  } catch (e) {
    console.error('vis-timeline: failed to save snapshot', e);
    new Notice('Failed to save timeline snapshot — see console for details');
  } finally {
    button.disabled = false;
  }
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getUniqueImagePath(app: App, sourcePath: string): Promise<string> {
  const lastSlash = sourcePath.lastIndexOf('/');
  const folder = lastSlash >= 0 ? sourcePath.slice(0, lastSlash) : '';
  for (let i = 1; ; i++) {
    const candidate = folder ? `${folder}/image${i}.png` : `image${i}.png`;
    if (!(await app.vault.adapter.exists(candidate))) return candidate;
  }
}

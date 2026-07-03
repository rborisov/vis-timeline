import { toPng } from 'html-to-image';

export interface Capture {
  dataUrl: string;
  width: number;
  height: number;
}

// Waits for layout to settle, then captures el as a PNG. Shared by the
// pubobs export path (rasterize, below) and the manual "save snapshot"
// button (save-snapshot.ts) — both need the same wait-then-capture
// sequence, just different things to do with the result.
export async function capturePng(el: HTMLElement): Promise<Capture> {
  // vis-timeline's layout (especially with autoHeight, which needs to
  // measure content, resize, then remeasure) can take more than a single
  // requestAnimationFrame to settle — waiting a fixed frame count was not
  // reliable. Instead, wait for the DOM to actually stop changing, the
  // same technique pubobs's own renderNoteToHTML uses for this exact
  // problem (see waitForStable below).
  await waitForStable(el);
  await waitForImages(el);
  const pixelRatio = window.devicePixelRatio || 1;
  const dataUrl = await toPng(el, { pixelRatio, cacheBust: true });
  const naturalHeight = await getImageNaturalHeight(dataUrl);
  const width = el.clientWidth;
  const height = Math.round(naturalHeight / pixelRatio);
  return { dataUrl, width, height };
}

export async function rasterize(el: HTMLElement, tl: { destroy(): void }): Promise<void> {
  try {
    const { dataUrl, width, height } = await capturePng(el);

    tl.destroy();
    el.empty();
    el.createEl('img', {
      cls: 'tl-export-img',
      attr: { src: dataUrl, width, height },
    });
  } catch (e) {
    // Rasterization is a nicety on top of an already-working interactive
    // widget — never let a failure here break the note. Leave `tl` mounted
    // and `el` untouched.
    console.error('vis-timeline: PNG rasterization failed, leaving interactive widget', e);
  }
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

// Waits until el's subtree stops mutating for quietForMs, up to maxWaitMs
// total. Starts with one animation-frame wait so renderTimeline()'s own
// scheduled redraw (see renderer.ts) has a chance to fire and produce at
// least one mutation before the quiet-period timer starts — otherwise an
// observer started before anything has changed yet could see "quiet"
// immediately and resolve before vis-timeline has laid out at all.
async function waitForStable(el: HTMLElement, quietForMs = 150, maxWaitMs = 2000): Promise<void> {
  await waitForNextFrame();
  return new Promise((resolve) => {
    let quietTimer: number;
    const done = () => {
      observer.disconnect();
      window.clearTimeout(maxTimer);
      window.clearTimeout(quietTimer);
      resolve();
    };
    const observer = new MutationObserver(() => {
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(done, quietForMs);
    });
    observer.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });
    const maxTimer: number = window.setTimeout(done, maxWaitMs);
    quietTimer = window.setTimeout(done, quietForMs);
  });
}

async function waitForImages(el: HTMLElement): Promise<void> {
  const images = Array.from(el.querySelectorAll('img'));
  await Promise.all(images.map((img) => img.decode().catch(() => undefined)));
}

function getImageNaturalHeight(dataUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalHeight);
    img.onerror = () => reject(new Error('Failed to load captured PNG for measurement'));
    img.src = dataUrl;
  });
}

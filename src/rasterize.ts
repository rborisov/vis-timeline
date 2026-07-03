import { toPng } from 'html-to-image';

export async function rasterize(el: HTMLElement, tl: { destroy(): void }): Promise<void> {
  try {
    await waitForImages(el);
    const pixelRatio = window.devicePixelRatio || 1;
    const dataUrl = await toPng(el, { pixelRatio, cacheBust: true });
    const naturalHeight = await getImageNaturalHeight(dataUrl);
    const width = el.clientWidth;
    const height = Math.round(naturalHeight / pixelRatio);

    tl.destroy();
    el.empty();
    const img = el.createEl('img', {
      attr: { src: dataUrl, width, height },
    });
    img.style.cssText = 'max-width:100%;height:auto;';
  } catch (e) {
    // Rasterization is a nicety on top of an already-working interactive
    // widget — never let a failure here break the note. Leave `tl` mounted
    // and `el` untouched.
    console.error('vis-timeline: PNG rasterization failed, leaving interactive widget', e);
  }
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

import type { App } from 'obsidian';

export function buildImageContent(label: string, src: string): string {
  return `<span class="tl-item"><img class="tl-thumb" src="${src}"><span class="tl-label">${label}</span></span>`;
}

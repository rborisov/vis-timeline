import type { App } from 'obsidian';

export function buildImageContent(label: string, src: string): string {
  return `<span class="tl-item"><img class="tl-thumb" src="${src}"><span class="tl-label">${label}</span></span>`;
}

// Matches ![[path]] or [[path]], with optional |alias
const WIKILINK_RE = /^!?\[\[(.+?)(?:\|[^\]]+)?\]\]$/;

export function resolveImageSrc(raw: string, app: App): string {
  const trimmed = raw.trim();

  const wikiMatch = WIKILINK_RE.exec(trimmed);
  if (wikiMatch) {
    const linkpath = wikiMatch[1]!;
    const file = app.metadataCache.getFirstLinkpathDest(linkpath, '');
    if (!file) return '';
    return app.vault.getResourcePath(file);
  }

  if (/^https?:\/\//.test(trimmed)) return trimmed;

  return '';
}

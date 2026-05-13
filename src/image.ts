import type { App } from 'obsidian';

export function buildImageContent(label: string, src: string): string {
  const safeSrc = src.replace(/"/g, '%22');
  return `<span class="tl-item"><img class="tl-thumb" src="${safeSrc}" style="height:50px;width:50px;object-fit:cover;border-radius:3px;flex-shrink:0"><span class="tl-label">${label}</span></span>`;
}

// Matches ![[path]], [[path]], and ![[path|alias]] (alias is stripped)
const WIKILINK_RE = /^!?\[\[(.+?)(?:\|[^\]]+)?\]\]$/;

export function resolveImageSrc(raw: string, app: App): string {
  const trimmed = raw.trim();

  const wikiMatch = WIKILINK_RE.exec(trimmed);
  if (wikiMatch) {
    const linkpath = wikiMatch[1]!;
    // sourcePath '' means resolve from vault root; Obsidian can't prefer co-located files without it
    const file = app.metadataCache.getFirstLinkpathDest(linkpath, '');
    if (!file) return '';
    return app.vault.getResourcePath(file);
  }

  if (/^https?:\/\//.test(trimmed)) return trimmed;

  return '';
}

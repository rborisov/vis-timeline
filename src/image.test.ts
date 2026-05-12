import { describe, it, expect, vi } from 'vitest';
import { buildImageContent, resolveImageSrc } from './image';
import type { App, TFile } from 'obsidian';

describe('buildImageContent', () => {
  it('wraps label and src in thumbnail layout HTML', () => {
    const html = buildImageContent('Dark Side', 'https://example.com/img.jpg');
    expect(html).toBe(
      '<span class="tl-item"><img class="tl-thumb" src="https://example.com/img.jpg"><span class="tl-label">Dark Side</span></span>'
    );
  });

  it('preserves existing HTML in label', () => {
    const html = buildImageContent('<b>Bold</b>', 'https://x.com/img.jpg');
    expect(html).toContain('<b>Bold</b>');
  });
});

describe('resolveImageSrc', () => {
  it('passes through https URLs unchanged', () => {
    expect(resolveImageSrc('https://example.com/img.jpg', {} as App)).toBe('https://example.com/img.jpg');
  });

  it('passes through http URLs unchanged', () => {
    expect(resolveImageSrc('http://example.com/img.jpg', {} as App)).toBe('http://example.com/img.jpg');
  });

  it('returns empty string for non-http non-wikilink strings (XSS guard)', () => {
    expect(resolveImageSrc('javascript:alert(1)', {} as App)).toBe('');
  });

  it('returns empty string for data: URIs (XSS guard)', () => {
    expect(resolveImageSrc('data:image/png;base64,abc', {} as App)).toBe('');
  });

  it('resolves ![[file.jpg]] wikilink via app', () => {
    const mockFile = { path: 'img/cover.jpg' } as TFile;
    const app = {
      metadataCache: { getFirstLinkpathDest: vi.fn().mockReturnValue(mockFile) },
      vault: { getResourcePath: vi.fn().mockReturnValue('app://vault/img/cover.jpg') },
    } as unknown as App;

    const result = resolveImageSrc('![[cover.jpg]]', app);

    expect(app.metadataCache.getFirstLinkpathDest).toHaveBeenCalledWith('cover.jpg', '');
    expect(app.vault.getResourcePath).toHaveBeenCalledWith(mockFile);
    expect(result).toBe('app://vault/img/cover.jpg');
  });

  it('resolves [[file.jpg]] (without leading !) via app', () => {
    const mockFile = { path: 'img/art.png' } as TFile;
    const app = {
      metadataCache: { getFirstLinkpathDest: vi.fn().mockReturnValue(mockFile) },
      vault: { getResourcePath: vi.fn().mockReturnValue('app://vault/img/art.png') },
    } as unknown as App;

    expect(resolveImageSrc('[[art.png]]', app)).toBe('app://vault/img/art.png');
  });

  it('strips display alias — ![[file.jpg|thumbnail]] resolves correctly', () => {
    const mockFile = { path: 'img/cover.jpg' } as TFile;
    const app = {
      metadataCache: { getFirstLinkpathDest: vi.fn().mockReturnValue(mockFile) },
      vault: { getResourcePath: vi.fn().mockReturnValue('app://vault/img/cover.jpg') },
    } as unknown as App;

    const result = resolveImageSrc('![[cover.jpg|thumbnail]]', app);

    expect(app.metadataCache.getFirstLinkpathDest).toHaveBeenCalledWith('cover.jpg', '');
    expect(result).toBe('app://vault/img/cover.jpg');
  });

  it('returns empty string when wikilink file is not found in vault', () => {
    const app = {
      metadataCache: { getFirstLinkpathDest: vi.fn().mockReturnValue(null) },
      vault: { getResourcePath: vi.fn() },
    } as unknown as App;

    expect(resolveImageSrc('![[missing.jpg]]', app)).toBe('');
    expect(app.vault.getResourcePath).not.toHaveBeenCalled();
  });
});

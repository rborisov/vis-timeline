import { describe, it, expect } from 'vitest';
import { buildImageContent } from './image';

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

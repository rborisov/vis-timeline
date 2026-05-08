import type { NormalizedTimelineItem, BlockOptions } from './types';
import { Timeline } from 'vis-timeline/standalone';

const DEFAULT_OPTIONS: Required<BlockOptions> = {
  height: '75vh',
  orientation: 'top',
  stack: true,
  zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
  zoomMax: 1000 * 60 * 60 * 24 * 365 * 10000,
};

export function renderTimeline(
  el: HTMLElement,
  items: NormalizedTimelineItem[],
  options: BlockOptions = {}
): { destroy(): void } {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  const container = el.createEl('div');
  container.className = 'timeline-plugin';
  container.style.width = '100%';
  container.style.height = merged.height;
  container.style.minHeight = '300px';

  const TimelineConstructor = Timeline as unknown as new (
    container: HTMLElement,
    items: NormalizedTimelineItem[],
    options?: Record<string, unknown>
  ) => { destroy(): void; redraw(): void };

  const tl = new TimelineConstructor(container, items, {
    editable: false,
    height: '100%',
    margin: { item: { horizontal: 10, vertical: 4 }, axis: 5 },
    orientation: merged.orientation,
    stack: merged.stack,
    zoomMin: merged.zoomMin,
    zoomMax: merged.zoomMax,
  });

  // Force a redraw after the next layout pass so vis-timeline gets real
  // container dimensions. Without this, iOS renders into a zero-size box.
  requestAnimationFrame(() => tl.redraw());

  return tl;
}

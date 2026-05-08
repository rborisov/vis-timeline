import type { NormalizedTimelineItem, NormalizedGroup, BlockOptions } from './types';
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
  options: BlockOptions = {},
  groups?: NormalizedGroup[]
): { destroy(): void } {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  const container = el.createEl('div');
  container.className = 'timeline-plugin';
  container.style.width = '100%';
  container.style.height = merged.height;
  container.style.minHeight = '300px';

  const TimelineConstructor = Timeline as unknown as new (
    ...args: unknown[]
  ) => { destroy(): void; redraw(): void };

  const visOptions = {
    editable: false,
    height: '100%',
    margin: { item: { horizontal: 10, vertical: 4 }, axis: 5 },
    orientation: merged.orientation,
    stack: merged.stack,
    zoomMin: merged.zoomMin,
    zoomMax: merged.zoomMax,
  };

  const tl = groups !== undefined
    ? new TimelineConstructor(container, items, groups, visOptions)
    : new TimelineConstructor(container, items, visOptions);

  // Force a redraw after the next layout pass so vis-timeline gets real
  // container dimensions. Without this, iOS renders into a zero-size box.
  requestAnimationFrame(() => tl.redraw());

  return tl;
}

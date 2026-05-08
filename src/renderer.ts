import type { NormalizedTimelineItem, BlockOptions } from './types';

const DEFAULT_OPTIONS: Required<BlockOptions> = {
  height: '75vh',
  orientation: 'top',
  stack: true,
  zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
  zoomMax: 1000 * 60 * 60 * 24 * 365 * 10000,
};

export async function renderTimeline(
  el: HTMLElement,
  items: NormalizedTimelineItem[],
  options: BlockOptions = {}
): Promise<void> {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  const container = el.createEl('div');
  container.className = 'vis-timeline-plugin';
  container.style.width = '100%';
  container.style.height = merged.height;
  container.style.minHeight = '300px';
  container.style.resize = 'vertical';
  container.style.overflow = 'auto';

  const { Timeline } = await import('vis-timeline/standalone');

  const TimelineConstructor = Timeline as unknown as new (
    container: HTMLElement,
    items: NormalizedTimelineItem[],
    options?: Record<string, unknown>
  ) => unknown;

  new TimelineConstructor(container, items, {
    editable: false,
    height: '100%',
    margin: { item: { horizontal: 10, vertical: 4 }, axis: 5 },
    orientation: merged.orientation,
    stack: merged.stack,
    verticalScroll: true,
    zoomMin: merged.zoomMin,
    zoomMax: merged.zoomMax,
  });
}

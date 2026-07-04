import type { NormalizedTimelineItem, NormalizedGroup, BlockOptions } from './types';
import { Timeline } from 'vis-timeline/standalone';

// height is intentionally not defaulted here — see renderTimeline() below:
// no explicit height means "grow to fit all content," not a fallback value.
const DEFAULT_OPTIONS: Required<Omit<BlockOptions, 'height'>> = {
  orientation: 'top',
  stack: true,
  zoomMin: 1000 * 60 * 60 * 24 * 365 * 10,
  zoomMax: 1000 * 60 * 60 * 24 * 365 * 10000,
};

export function renderTimeline(
  el: HTMLElement,
  items: NormalizedTimelineItem[],
  options: BlockOptions = {},
  groups?: NormalizedGroup[],
  onItemClick?: (id: string | number) => void,
  autoHeight = false
): { destroy(): void; redraw(): void } {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const explicitHeight = options.height;
  // A fixed height only applies if the block explicitly asked for one
  // (the documented `height` option) and this isn't the export path — a
  // rasterized PNG has no scrolling, so it always grows to fit everything
  // regardless of what the block's height option says. Otherwise (no
  // explicit height, the common case), the widget now grows to show the
  // full diagram by default instead of clipping to a fixed viewport height.
  const useFixedHeight = !autoHeight && explicitHeight !== undefined;

  const container = el.createEl('div');
  container.className = 'timeline-plugin';
  if (useFixedHeight) {
    container.style.height = explicitHeight;
  } else {
    // No clipping/scrolling needed once the container grows to fit content
    // — overrides .vis-timeline's overflow:hidden (otherwise kept for the
    // rounded-card look) in case vis-timeline's height calculation ever
    // comes out even slightly short of the actual content height.
    container.addClass('tl-auto-height');
  }
  if (autoHeight) {
    // The export path is otherwise constrained to the width of whatever
    // ambient container it's rendered into (pubobs's fixed 800px offscreen
    // container) — cramming a wide date range into that narrow a width
    // makes some item labels too wide for their bars, so they get clipped
    // by overflow:hidden. Rendering wider first and letting the exported
    // <img> scale down responsively (it already does, via max-width:100%)
    // gives labels room without changing how the final image displays.
    container.addClass('tl-export-width');
  }

  const TimelineConstructor = Timeline as unknown as new (
    ...args: unknown[]
  ) => { destroy(): void; redraw(): void; on(event: string, cb: (props: { item?: string | number | null; what?: string }) => void): void };

  const visOptions = {
    editable: false,
    height: useFixedHeight ? '100%' : undefined,
    // Only enable when there's an actual fixed height to scroll within.
    // vis-timeline's own CSS makes verticalScroll force its *internal*
    // group-label panels into height:100%+overflow-y:scroll (a separate,
    // deeper mechanism from our outer container) — in auto-height mode
    // (both the interactive default and the export path) there's no bound
    // to scroll within, and this bounded/scrollable internal state was
    // actively preventing those panels from growing to fit content,
    // clipping the last group instead of just being unnecessary.
    verticalScroll: useFixedHeight,
    margin: { item: { horizontal: 10, vertical: 4 }, axis: 5 },
    orientation: merged.orientation,
    stack: merged.stack,
    zoomMin: merged.zoomMin,
    zoomMax: merged.zoomMax,
    // Allow inline styles on img/span — our resolveImageSrc already
    // restricts sources to vault wikilinks and https:// URLs.
    xss: { disabled: true },
    // vis-timeline animates its own initial fit-to-content view by default
    // (a JS-driven transition, not CSS — disabling CSS transitions doesn't
    // touch it). That's fine for interactive use, but the export path
    // captures shortly after construction and would otherwise capture
    // mid-animation. Only disable it for the export path so interactive
    // users keep their normal smooth pan/zoom behavior.
    animation: !autoHeight,
  };

  const tl = groups !== undefined
    ? new TimelineConstructor(container, items, groups, visOptions)
    : new TimelineConstructor(container, items, visOptions);

  if (onItemClick) {
    tl.on('click', (props) => {
      if (props?.what === 'item' && props.item != null) {
        onItemClick(props.item);
      }
    });
  }

  // Force a redraw after the next layout pass so vis-timeline gets real
  // container dimensions. Without this, iOS renders into a zero-size box.
  window.requestAnimationFrame(() => tl.redraw());

  return tl;
}

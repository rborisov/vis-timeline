export interface RawTimelineItem {
  content?: string;
  start?: string | number;
  end?: string | number;
  className?: string;
  title?: string;
  type?: string;
  group?: string | number;
  [key: string]: unknown;
}

export interface NormalizedTimelineItem {
  content: string;
  start: Date | string;
  end?: Date | string;
  className?: string;
  title?: string;
  type?: string;
  group?: string | number;
}

export interface BlockOptions {
  height?: string;
  orientation?: 'top' | 'bottom' | 'both';
  stack?: boolean;
  zoomMin?: number;
  zoomMax?: number;
}

export interface ParseResult {
  items: RawTimelineItem[];
  options: BlockOptions;
}

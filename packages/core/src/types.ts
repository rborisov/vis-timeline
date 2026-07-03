export interface RawTimelineItem {
  content?: string;
  start?: string | number;
  end?: string | number;
  className?: string;
  title?: string;
  type?: string;
  group?: string | number;
  image?: string;
  [key: string]: unknown;
}

export interface NormalizedTimelineItem {
  id?: string | number;
  content: string;
  start: Date | string;
  end?: Date | string;
  className?: string;
  title?: string;
  type?: string;
  group?: string | number;
  image?: string;
}

export interface RawGroupItem {
  id: string | number;
  content?: string;
  nestedGroups?: (string | number)[];
  showNested?: boolean;
  className?: string;
}

export interface NormalizedGroup {
  id: string | number;
  content: string;
  nestedGroups?: (string | number)[];
  showNested?: boolean;
  className?: string;
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
  groups?: RawGroupItem[];
  options: BlockOptions;
}

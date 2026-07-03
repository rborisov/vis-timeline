export interface SavedTimelineWindow {
  start: number;
  end: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TimelineBlockSettings {
  savedViews?: Record<string, Record<string, SavedTimelineWindow>>;
}

export const DEFAULT_SETTINGS: TimelineBlockSettings = {};

export interface SavedTimelineWindow {
  start: number;
  end: number;
}

export interface TimelineBlockSettings {
  savedViews?: Record<string, Record<string, SavedTimelineWindow>>;
}

export const DEFAULT_SETTINGS: TimelineBlockSettings = {};

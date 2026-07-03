import type { TimelineBlockSettings, SavedTimelineWindow } from './settings';

// Deterministic, non-cryptographic string hash (DJB2) — good enough for a
// cache key, not a security boundary.
export function hashBlockSource(source: string): string {
  let hash = 5381;
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) + hash + source.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16);
}

export function getSavedWindow(
  settings: TimelineBlockSettings,
  sourcePath: string,
  blockHash: string
): SavedTimelineWindow | undefined {
  return settings.savedViews?.[sourcePath]?.[blockHash];
}

export function setSavedWindow(
  settings: TimelineBlockSettings,
  sourcePath: string,
  blockHash: string,
  window: SavedTimelineWindow
): void {
  settings.savedViews ??= {};
  settings.savedViews[sourcePath] ??= {};
  settings.savedViews[sourcePath][blockHash] = window;
}

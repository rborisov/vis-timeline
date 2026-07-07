import { describe, it, expect, vi } from 'vitest';

vi.mock('obsidian', () => ({
  TFile: class TFile {
    path = '';
  },
}));

import { TFile } from 'obsidian';
import { deleteExportAsset } from './export-asset';
import type { App } from 'obsidian';

describe('deleteExportAsset', () => {
  it('deletes the file when it still exists in the vault', async () => {
    const file = Object.assign(new TFile(), { path: 'notes/my-note-timeline-deadbeef.png' });
    const getAbstractFileByPath = vi.fn().mockReturnValue(file);
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    const app = {
      vault: {
        getAbstractFileByPath,
        delete: deleteFn,
      },
    } as unknown as App;

    await deleteExportAsset(app, file);

    expect(getAbstractFileByPath).toHaveBeenCalledWith(file.path);
    expect(deleteFn).toHaveBeenCalledWith(file);
  });

  it('does nothing when the file was already removed', async () => {
    const file = Object.assign(new TFile(), { path: 'notes/my-note-timeline-deadbeef.png' });
    const deleteFn = vi.fn();
    const app = {
      vault: {
        getAbstractFileByPath: vi.fn().mockReturnValue(null),
        delete: deleteFn,
      },
    } as unknown as App;

    await deleteExportAsset(app, file);

    expect(deleteFn).not.toHaveBeenCalled();
  });
});

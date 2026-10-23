import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveTextFile } from './fileSave';

describe('saveTextFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the Android bridge when available', () => {
    const saveFile = vi.fn(() => 'Downloads/Sanchay/backup.json');
    vi.stubGlobal('window', { SanchayAndroid: { saveFile } });

    expect(saveTextFile('backup.json', '{"ok":true}', 'application/json')).toEqual({
      via: 'android',
      location: 'Downloads/Sanchay/backup.json',
    });
    expect(saveFile).toHaveBeenCalledWith(
      'backup.json',
      'application/json',
      '{"ok":true}'
    );
  });

  it('reports a native save failure without falling back to a blob download', () => {
    const saveFile = vi.fn(() => null);
    vi.stubGlobal('window', { SanchayAndroid: { saveFile } });

    expect(saveTextFile('backup.json', '{}', 'application/json')).toEqual({
      via: 'failed',
    });
  });

  it('reports bridge exceptions as failures', () => {
    vi.stubGlobal('window', {
      SanchayAndroid: {
        saveFile: () => {
          throw new Error('disk full');
        },
      },
    });

    expect(saveTextFile('backup.json', '{}', 'application/json')).toEqual({
      via: 'failed',
    });
  });
});

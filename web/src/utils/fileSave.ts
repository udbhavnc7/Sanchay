interface AndroidFileBridge {
  saveFile(fileName: string, mimeType: string, content: string): string | null;
}

export type FileSaveResult =
  | { via: 'android'; location: string }
  | { via: 'browser' }
  | { via: 'failed' };

export function saveTextFile(
  fileName: string,
  content: string,
  mimeType = 'text/plain'
): FileSaveResult {
  const bridge = (
    window as Window & { SanchayAndroid?: Partial<AndroidFileBridge> }
  ).SanchayAndroid;

  if (bridge?.saveFile) {
    try {
      const location = bridge.saveFile(fileName, mimeType, content);
      return location ? { via: 'android', location } : { via: 'failed' };
    } catch {
      return { via: 'failed' };
    }
  }

  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { via: 'browser' };
  } catch {
    return { via: 'failed' };
  }
}

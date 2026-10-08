/** Macht aus einem beliebigen Fehlerwert eine anzeigbare Meldung für die Oberfläche. */
export function toErrorMessage(error: unknown): string {
  let raw = 'Es ist ein unbekannter Fehler aufgetreten.';
  if (error instanceof Error && error.message) {
    raw = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    raw = error.message;
  } else if (typeof error === 'string' && error.trim()) {
    raw = error;
  }
  // Electron-IPC verpackt Fehler als "Error invoking remote method ...: Error: <Text>"; nur der eigentliche Text soll sichtbar sein.
  const marker = 'Error: ';
  const index = raw.lastIndexOf(marker);
  return index >= 0 ? raw.slice(index + marker.length) : raw;
}

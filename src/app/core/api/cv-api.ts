// Zentraler Zugriffspunkt auf die Daten-/Datei-Schnittstelle: Electron-Preload oder Browser-Ersatz.
import { isDevMode } from '@angular/core';
import type { CvApi } from '@shared/ipc/ipc-api';
import { createBrowserCvApi } from './browser-cv-api';

/** Einmalig erzeugter Browser-Ersatz, damit alle Aufrufer denselben Speicher teilen. */
let browserApi: CvApi | null = null;

/**
 * Liefert die Desktop-API aus dem Electron-Preload (`window.cvApi`).
 * Nur im Entwicklungsmodus gibt es ohne Electron einen Browser-Ersatz (IndexedDB); im Produktions-Build wird sonst ein Fehler geworfen.
 */
export function getCvApi(): CvApi {
  if (typeof window !== 'undefined' && window.cvApi) {
    return window.cvApi;
  }
  if (isDevMode()) {
    browserApi ??= createBrowserCvApi();
    return browserApi;
  }
  throw new Error('Die Desktop-Schnittstelle ist nicht verfügbar. Bitte die App mit Electron starten.');
}

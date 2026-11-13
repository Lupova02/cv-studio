// Zentraler Zugriffspunkt auf die Daten-/Datei-Schnittstelle: Electron-Preload oder Browser-Ersatz.
import { isDevMode } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import type { CvApi } from '@shared/ipc/ipc-api';
import { createBrowserCvApi } from './browser-cv-api';
import { createCapacitorCvApi } from './capacitor-cv-api';

/** Einmalig erzeugter Browser- bzw. Mobile-Ersatz, damit alle Aufrufer denselben Speicher teilen. */
let browserApi: CvApi | null = null;

/**
 * Liefert die Desktop-API aus dem Electron-Preload (`window.cvApi`), in der Mobile-App (Capacitor) die
 * Dateispeicher-Variante. Nur im Entwicklungsmodus gibt es sonst einen Browser-Ersatz (IndexedDB);
 * im Produktions-Build wird ohne Electron/Capacitor ein Fehler geworfen.
 */
export function getCvApi(): CvApi {
  if (typeof window !== 'undefined' && window.cvApi) {
    return window.cvApi;
  }
  if (Capacitor.isNativePlatform()) {
    browserApi ??= createCapacitorCvApi();
    return browserApi;
  }
  if (isDevMode()) {
    browserApi ??= createBrowserCvApi();
    return browserApi;
  }
  throw new Error('Die Desktop-Schnittstelle ist nicht verfügbar. Bitte die App mit Electron starten.');
}

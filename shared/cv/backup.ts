// Erstellen und Einlesen der JSON-Sicherung (Lebenslauf plus eingebettetes Foto).
// Genutzt vom Electron-Hauptprozess und von der Browser-Variante der Oberfläche (IndexedDB).
import { SCHEMA_VERSION, type CvData, type CvLanguage } from './cv-data';
import { CvValidationError, migrate } from './cv-migrate';
import { uiText } from '../i18n/ui-text';

/** Kennzeichen im Feld `format`, an dem eine CV-Studio-Sicherung erkennbar ist. */
export const BACKUP_FORMAT = 'cv-studio-backup';
/** Größte erlaubte Sicherungsdatei (20 MB); größere werden vor dem Einlesen abgelehnt. */
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

/** Erlaubte Foto-Data-URLs: nur PNG, JPEG oder WebP in sauberem Base64. */
const PHOTO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** Eine Lebenslauf-Datei plus eingebettetes Foto, damit eine Sicherung auf jedem Rechner alles wiederherstellt. */
export type CvBackup = { format: typeof BACKUP_FORMAT; exportedAt: string } & CvData & { photoDataUrl?: string };

/** Ergebnis von `parseBackup`: bereinigte Daten und, falls vorhanden und gültig, das Foto. */
export interface ParsedBackup {
  data: CvData;
  /** Foto als Data-URL; `null` = kein (gültiges) Foto in der Datei. */
  photoDataUrl: string | null;
}

/** Prüft, ob der Wert ein einfaches Objekt ist (kein Array, nicht `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Prüft, ob der Wert eine zulässige Foto-Data-URL ist (Bildformat, Base64, Größe). */
export function isPhotoDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_BACKUP_BYTES && PHOTO_DATA_URL.test(value);
}

/**
 * Baut die Sicherung aus bereinigten Daten und Zeitstempel. Das Foto wird nur eingebettet,
 * wenn der Lebenslauf eins verwendet und die Data-URL gültig ist. `now` ist für Tests austauschbar.
 */
export function createBackup(data: CvData, photoDataUrl: string | null, now = new Date()): CvBackup {
  const backup: CvBackup = { format: BACKUP_FORMAT, exportedAt: now.toISOString(), ...migrate(data) };
  if (data.personal.photoFile && isPhotoDataUrl(photoDataUrl)) {
    backup.photoDataUrl = photoDataUrl;
  }
  return backup;
}

/** Wandelt die Sicherung in eingerückten JSON-Text mit abschließendem Zeilenumbruch um. */
export function serializeBackup(backup: CvBackup): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

/**
 * Liest den Text einer Sicherungsdatei ein. Akzeptiert aktuelle Sicherungen ebenso wie reine cv-data.json-Dateien
 * früherer Versionen. Wirft `CvValidationError` mit Meldung in `language`, wenn die Datei unbrauchbar oder zu neu ist.
 */
export function parseBackup(text: string, language: CvLanguage): ParsedBackup {
  const copy = uiText(language);
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new CvValidationError(copy.backupInvalid);
  }
  if (!isRecord(raw)) {
    throw new CvValidationError(copy.backupInvalid);
  }
  // Eigene Prüfung vor `migrate`, damit die Meldung in der gewählten Sprache erscheint (`migrate` meldet nur auf Deutsch).
  if (typeof raw['schemaVersion'] === 'number' && raw['schemaVersion'] > SCHEMA_VERSION) {
    throw new CvValidationError(copy.backupTooNew);
  }
  let data: CvData;
  try {
    data = migrate(raw);
  } catch (error) {
    // Die genauen Prüfmeldungen von `migrate` gibt es nur auf Deutsch; sonst die allgemeine Meldung in der Oberflächensprache.
    if (error instanceof CvValidationError && language !== 'de') {
      throw new CvValidationError(copy.backupInvalid);
    }
    throw error;
  }
  const photo = raw['photoDataUrl'];
  return { data, photoDataUrl: isPhotoDataUrl(photo) ? photo : null };
}

/** Vorgeschlagener Dateiname der Sicherung in der jeweiligen Sprache, z. B. 'lebenslauf-sicherung-2026-10-08.json' (lokales Datum). */
export function backupFileName(language: CvLanguage, now = new Date()): string {
  const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
  return `${uiText(language).backupFileBase}-${day}.json`;
}

// Prüft ungeprüfte IPC-Nachrichten aus dem Renderer, bevor der Electron-Hauptprozess sie verwendet.
// Anders als `migrate` wirft diese Prüfung bei falscher Vorlage, Sprache oder Farbe, statt still zu korrigieren.
import type { CvFont, CvLanguage, TemplateOptions } from '../cv/cv-data';
import type { PrintJob } from './ipc-api';
import { CV_FONTS, ENTRY_ORDERS, PAGE_NUMBER_PLACES, PAGE_NUMBER_STYLES, SKILL_SCALES, TEMPLATE_IDS, type TemplateId } from '../cv/cv-data';
import { CvValidationError, migrate } from '../cv/cv-migrate';

/** Prüft, ob der Wert ein einfaches Objekt ist (kein Array, nicht `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Liefert den Wert, wenn er in `allowed` vorkommt, sonst `fallback`. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Übernimmt eine bekannte Vorlagen-Kennung, wirft sonst. */
function asTemplateId(value: unknown): TemplateId {
  if (typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value)) {
    return value as TemplateId;
  }
  throw new CvValidationError('Unbekanntes Lebenslauf-Design.');
}

/** Übernimmt 'de', 'en' oder 'tr', wirft sonst. */
function asLanguage(value: unknown): CvLanguage {
  if (value === 'de' || value === 'en' || value === 'tr') {
    return value;
  }
  throw new CvValidationError('Die Sprache muss Deutsch, Englisch oder Türkisch sein.');
}

/** Übernimmt eine Hex-Farbe '#rrggbb' (kleingeschrieben), wirft sonst. */
function asAccent(value: unknown): string {
  if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  throw new CvValidationError('Die Akzentfarbe muss ein Hex-Wert wie #1f4b99 sein.');
}

/**
 * Prüft die Darstellungsoptionen eines Druckauftrags. Farbe und Sprache müssen gültig sein (sonst Fehler),
 * übrige Felder fallen auf Standardwerte zurück. `photoDataUrl` wird bewusst nicht übernommen.
 */
export function parseTemplateOptions(value: unknown): TemplateOptions {
  if (!isRecord(value)) {
    throw new CvValidationError('Die Vorlagenoptionen sind ungültig.');
  }
  return {
    showPhoto: value['showPhoto'] === true,
    showGender: value['showGender'] !== false,
    accentColor: asAccent(value['accentColor']),
    language: asLanguage(value['language']),
    skillScale: oneOf(value['skillScale'], SKILL_SCALES, 'stars'),
    datePlace: value['datePlace'] === 'below' ? 'below' : 'aside',
    timeline: value['timeline'] === 'off' ? 'off' : 'line',
    entryOrder: oneOf(value['entryOrder'], ENTRY_ORDERS, 'manual'),
    font: typeof value['font'] === 'string' && (CV_FONTS as readonly string[]).includes(value['font']) ? (value['font'] as CvFont) : 'sourceSans',
    pageNumbers: oneOf(value['pageNumbers'], PAGE_NUMBER_STYLES, 'fraction'),
    pageNumberPlace: oneOf(value['pageNumberPlace'], PAGE_NUMBER_PLACES, 'right'),
  };
}

/** Prüft einen Druckauftrag für den PDF-Export: Vorlage, Optionen und Lebenslaufdaten (letztere per `migrate`). */
export function parsePrintJob(value: unknown): PrintJob {
  if (!isRecord(value)) {
    throw new CvValidationError('Der Export-Auftrag ist ungültig.');
  }
  return {
    templateId: asTemplateId(value['templateId']),
    options: parseTemplateOptions(value['options']),
    data: migrate(value['data']),
  };
}

/**
 * Prüft nur, dass der Foto-Dateiname ein Text ist; `''` ist erlaubt (= kein Foto).
 * Die eigentliche Prüfung gegen Pfad-Tricks übernimmt der Fotospeicher im Hauptprozess.
 */
export function parsePhotoFileName(value: unknown): string {
  if (typeof value !== 'string') {
    throw new CvValidationError('Der Dateiname des Fotos ist ungültig.');
  }
  return value;
}

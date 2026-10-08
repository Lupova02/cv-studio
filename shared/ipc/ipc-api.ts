// Vertrag zwischen Oberfläche und Datenhaltung: Schnittstelle `CvApi` samt Nachrichtentypen.
// Umgesetzt vom Electron-Preload (window.cvApi, leitet an den Hauptprozess weiter) und von der Browser-Variante (IndexedDB).
import type { CvData, CvLanguage, TemplateId, TemplateOptions } from '../cv/cv-data';

/** Auftrag für den PDF-Export: welche Vorlage mit welchen Optionen und Daten gedruckt wird. */
export interface PrintJob {
  templateId: TemplateId;
  /** Ohne Foto; die Druckansicht lädt es anhand von `data.personal.photoFile` selbst nach. */
  options: TemplateOptions;
  data: CvData;
}

/** Ein gespeichertes Foto: Dateiname im Fotospeicher und Bild als Data-URL zur Anzeige. */
export interface PhotoImportResult {
  fileName: string;
  dataUrl: string;
}

/** Ergebnis einer eingelesenen Sicherung. `data.personal.photoFile` passt immer zu `photo`: es ist leer, wenn kein Foto wiederhergestellt werden konnte. */
export interface BackupImport {
  data: CvData;
  photo: PhotoImportResult | null;
}

/** Alle Funktionen, die die Oberfläche für Speichern, Fotos, Sicherung und PDF-Export braucht. */
export interface CvApi {
  /** Verfügbarkeitstest der Schnittstelle. */
  ping(): Promise<{ ok: true }>;
  /** Lädt den gespeicherten Lebenslauf (bereinigt); ohne gespeicherte Daten einen leeren. */
  load(): Promise<CvData>;
  /** Speichert den Lebenslauf; die Daten werden vorher erneut geprüft. */
  save(data: CvData): Promise<void>;
  /** Lässt eine Sicherungsdatei auswählen und einlesen; `null` = abgebrochen. Speichert noch nichts außer dem Foto. */
  importBackup(): Promise<BackupImport | null>;
  /** Schreibt eine Sicherung inklusive Foto; `false` = abgebrochen. */
  exportBackup(data: CvData): Promise<boolean>;
  /** Lässt ein Bild auswählen und legt es als PNG im Fotospeicher ab; `null` = abgebrochen. */
  importPhoto(): Promise<PhotoImportResult | null>;
  /** Liefert ein gespeichertes Foto als Data-URL; `null` = nicht vorhanden oder ungültiger Name. */
  readPhoto(fileName: string): Promise<string | null>;
  /** Löscht ein gespeichertes Foto. */
  removePhoto(fileName: string): Promise<void>;
  /** Rendert den Lebenslauf in einer versteckten Druckansicht als PDF und lässt ihn speichern; `false` = abgebrochen. */
  exportPdf(request: PrintJob): Promise<boolean>;
  /** Nur für die Druckansicht: holt den anstehenden Druckauftrag ab; `null` = keiner vorhanden (in Electron nur einmal abholbar). */
  takePrintJob(): Promise<PrintJob | null>;
  /** Nur für die Druckansicht: meldet, dass alles gerendert ist und das PDF erzeugt werden kann. */
  signalPrintReady(): Promise<void>;
  /** Registriert eine Speicherfunktion, die beim Schließen des Fensters noch ausgeführt wird (Electron wartet höchstens 3 s). */
  prepareForClose(save: () => Promise<void>): void;
}

export type { CvLanguage };

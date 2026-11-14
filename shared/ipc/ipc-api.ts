// Vertrag zwischen Oberfläche und Datenhaltung: Schnittstelle `CvApi` samt Nachrichtentypen.
// Umgesetzt vom Electron-Preload (window.cvApi, leitet an den Hauptprozess weiter) und von der Browser-Variante (IndexedDB).
import type { CvData, CvLanguage, TemplateId, TemplateOptions, TemplateSettings } from '../cv/cv-data';
import type { CvLibrary } from '../cv/cv-library';

/** Auftrag für den PDF-Export: welche Vorlage mit welchen Optionen und Daten gedruckt wird. */
export interface PrintJob {
  templateId: TemplateId;
  /** Ohne Foto; die Druckansicht lädt es anhand von `data.personal.photoFile` selbst nach. */
  options: TemplateOptions;
  data: CvData;
}

/** Ein gespeichertes Foto: Dateiname im Fotospeicher und Bild als Data-URL zur Anzeige. */
/** Wünsche an die Fotoauswahl: Quelle und Seitenverhältnis (Breite/Höhe) des Zuschnitts, rund oder eckig. */
export interface PhotoImportOptions {
  source?: 'camera' | 'library';
  aspect?: number;
  round?: boolean;
}

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
  /** Verzeichnis aller gespeicherten Lebensläufe samt aktivem. */
  library(): Promise<CvLibrary>;
  /** Öffnet einen anderen gespeicherten Lebenslauf und liefert seine Daten. Vorher ausstehende Änderungen speichern! */
  switchCv(id: string): Promise<CvData>;
  /** Legt einen neuen Lebenslauf an (ohne Foto) und macht ihn aktiv; `data` = `null` für einen leeren. */
  createCv(name: string, data: CvData | null): Promise<CvLibrary>;
  /** Kopiert einen gespeicherten Lebenslauf samt Foto und macht die Kopie aktiv. */
  duplicateCv(id: string, name: string): Promise<CvLibrary>;
  renameCv(id: string, name: string): Promise<CvLibrary>;
  /** Löscht einen Lebenslauf samt Foto; der letzte bleibt bestehen. */
  deleteCv(id: string): Promise<CvLibrary>;
  /** „Alle Daten löschen“: entfernt alle Lebensläufe und Fotos, übrig bleibt ein leerer mit diesem Design. */
  resetAll(template: TemplateSettings): Promise<void>;
  /** Lässt eine Sicherungsdatei auswählen und einlesen; `null` = abgebrochen. Speichert noch nichts außer dem Foto. */
  importBackup(): Promise<BackupImport | null>;
  /** Schreibt eine Sicherung inklusive Foto; `false` = abgebrochen. */
  exportBackup(data: CvData): Promise<boolean>;
  /**
   * Lässt ein Bild auswählen und legt es als PNG im Fotospeicher ab; `null` = abgebrochen.
   * Browser/Mobile berücksichtigen `options` (Kamera oder Galerie, Zuschneiden); Electron nutzt den Dateidialog.
   */
  importPhoto(options?: PhotoImportOptions): Promise<PhotoImportResult | null>;
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
  /** Nur Electron: Befehle aus der Menüleiste (PDF, Sicherung, Rückgängig …) an die Oberfläche melden. */
  onMenuCommand?(listener: (command: MenuCommand) => void): void;
}

/** Befehle der Menüleiste (Electron); die Oberfläche führt sie wie die gleichnamigen Knöpfe aus. */
export const MENU_COMMANDS = ['export-pdf', 'export-backup', 'import-backup', 'undo', 'redo', 'quality', 'toggle-sample', 'cycle-theme'] as const;
export type MenuCommand = (typeof MENU_COMMANDS)[number];

export type { CvLanguage, CvLibrary };

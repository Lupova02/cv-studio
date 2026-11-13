// Mobile-App (Capacitor, Android/iOS): Daten und Fotos als JSON-Dateien im privaten App-Ordner (Filesystem, Directory.Data),
// Sicherung und PDF über den Teilen-Dialog des Systems. Das PDF erzeugt das app-eigene native Plugin „CvPrint“
// aus der Druckansicht (#/print) – auf Android über den WebView-Druckadapter, auf iOS über WKWebView.createPDF.
import { registerPlugin } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { CvLanguage } from '@shared/cv/cv-data';
import { suggestFileBase } from '@shared/format/file-name';
import type { CvApi, PrintJob } from '@shared/ipc/ipc-api';
import { uiText } from '@shared/i18n/ui-text';
import type { BrowserStore } from './browser-store';
import { createWebCvApi, type PrintHandoff } from './web-cv-api';

/** App-eigenes natives Plugin (android/app/…/CvPrintPlugin.java, ios/App/App/CvPrintPlugin.swift). */
interface CvPrintPlugin {
  /**
   * Erzeugt aus der aktuell angezeigten Seite ein A4-PDF im Cache-Ordner. `uri` ist leer, wenn stattdessen
   * der System-Druckdialog geöffnet wurde (Rückfall auf Android, falls die direkte Erzeugung scheitert).
   */
  printToPdf(options: { fileName: string }): Promise<{ uri: string }>;
}

const CvPrint = registerPlugin<CvPrintPlugin>('CvPrint');

/** Unterordner im privaten App-Speicher. */
const ROOT = 'cv-studio';
const HANDOFF_KEY = '__cvPrintHandoff';

type HandoffWindow = Window & { [HANDOFF_KEY]?: PrintHandoff };

/** Dateipfad eines Speicherschlüssels; nur unbedenkliche Zeichen. */
function fileFor(key: string): string {
  return `${ROOT}/${key.replace(/[^A-Za-z0-9.-]/g, '_')}.json`;
}

async function exists(path: string, directory = Directory.Data): Promise<boolean> {
  try {
    await Filesystem.stat({ path, directory });
    return true;
  } catch {
    return false;
  }
}

/**
 * Schlüssel-Wert-Speicher auf Dateien. Geschrieben wird erst in `<datei>.tmp`, dann umbenannt; bricht die App
 * zwischen Löschen und Umbenennen ab, wird beim Lesen die Temp-Datei verwendet. Lesefehler einer vorhandenen
 * Datei werden weitergereicht (nicht als „fehlt“ gewertet), damit nie versehentlich leere Daten gespeichert werden.
 */
function fileStore(): BrowserStore {
  return {
    get: async <T>(key: string): Promise<T | undefined> => {
      const path = fileFor(key);
      let target = path;
      if (!(await exists(path))) {
        if (!(await exists(`${path}.tmp`))) {
          return undefined;
        }
        target = `${path}.tmp`;
      }
      const result = await Filesystem.readFile({ path: target, directory: Directory.Data, encoding: Encoding.UTF8 });
      return JSON.parse(String(result.data)) as T;
    },
    set: async (key, value) => {
      const path = fileFor(key);
      const temporary = `${path}.tmp`;
      await Filesystem.writeFile({
        path: temporary,
        data: JSON.stringify(value),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      if (await exists(path)) {
        await Filesystem.deleteFile({ path, directory: Directory.Data });
      }
      await Filesystem.rename({ from: temporary, to: path, directory: Directory.Data, toDirectory: Directory.Data });
    },
    delete: async (key) => {
      const path = fileFor(key);
      for (const target of [path, `${path}.tmp`]) {
        if (await exists(target)) {
          await Filesystem.deleteFile({ path: target, directory: Directory.Data });
        }
      }
    },
  };
}

/** `true`, wenn die Nutzerin den Teilen-Dialog nur geschlossen hat. */
function isCancel(error: unknown): boolean {
  return /cancel/i.test(error instanceof Error ? error.message : String(error));
}

/** Öffnet den Teilen-Dialog für eine Datei; `false`, wenn er abgebrochen wurde. */
async function shareFile(uri: string, language: CvLanguage): Promise<boolean> {
  try {
    await Share.share({ title: uiText(language).shareTitle, files: [uri] });
    return true;
  } catch (error) {
    if (isCancel(error)) {
      return false;
    }
    throw error;
  }
}

/** Legt eine erzeugte Datei (Sicherung) im Cache ab und bietet sie zum Teilen bzw. Speichern in „Dateien“ an. */
async function deliverFile(fileName: string, contents: Blob, language: CvLanguage): Promise<boolean> {
  const path = `exports/${fileName}`;
  await Filesystem.writeFile({ path, data: await contents.text(), directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
  return shareFile(uri, language);
}

/**
 * Zeigt kurz die Druckansicht im App-Fenster, lässt das native Plugin daraus ein PDF erzeugen,
 * kehrt zum Editor zurück und öffnet den Teilen-Dialog.
 */
async function printPdf(job: PrintJob, photos: ReadonlyMap<string, string>): Promise<boolean> {
  const host = window as HandoffWindow;
  const language = job.data.template.language;
  const failed = uiText(language).pdfFailed;
  let uri = '';
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(failed)), 20000);
      host[HANDOFF_KEY] = {
        job,
        photos,
        ready: () => {
          clearTimeout(timer);
          resolve();
        },
      };
      location.hash = '#/print';
    });
    uri = (await CvPrint.printToPdf({ fileName: `${suggestFileBase(job.data)}.pdf` })).uri;
  } finally {
    delete host[HANDOFF_KEY];
    location.hash = '#/';
  }
  // Leerer Pfad: Der System-Druckdialog hat übernommen (dort „Als PDF speichern“).
  return uri ? shareFile(uri, language) : false;
}

/** `CvApi` der Mobile-App. */
export function createCapacitorCvApi(): CvApi {
  return createWebCvApi({
    store: Promise.resolve(fileStore()),
    deliverFile,
    printPdf,
    handoff: () => (window as HandoffWindow)[HANDOFF_KEY] ?? null,
  });
}

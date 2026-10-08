// Browser-Ersatz für die Electron-API (nur Entwicklungsmodus): Daten und Fotos in IndexedDB,
// Dateiauswahl über <input type="file">, PDF-Export über den Druckdialog eines versteckten iframes.
import { MAX_BACKUP_BYTES, backupFileName, createBackup, parseBackup, serializeBackup } from '@shared/cv/backup';
import type { CvLanguage } from '@shared/cv/cv-data';
import { migrate } from '@shared/cv/cv-migrate';
import { suggestFileBase } from '@shared/format/file-name';
import type { BackupImport, CvApi, PhotoImportResult, PrintJob } from '@shared/ipc/ipc-api';
import { uiText } from '@shared/i18n/ui-text';
import { openBrowserStore, type BrowserStore } from './browser-store';
import { dataUrlToBlob } from './data-url';

/** Name der Eigenschaft am Editor-Fenster, über die das Druck-iframe seinen Auftrag abholt. */
const HANDOFF_KEY = '__cvPrintHandoff';
const CV_KEY = 'cv';
const MAX_PHOTO_EDGE = 800;

/** Übergabe vom Editor an das Druck-iframe: Auftrag, Fotos und Rückmeldung „fertig gerendert“. */
interface PrintHandoff {
  job: PrintJob;
  photos: ReadonlyMap<string, string>;
  ready: () => void;
}

type HandoffWindow = Window & { [HANDOFF_KEY]?: PrintHandoff };

/** Speicherschlüssel eines Fotos im Browser-Speicher. */
function photoKey(fileName: string): string {
  return `photo:${fileName}`;
}

/** Im versteckten Druck-iframe liegen Auftrag und Fotos im Editor-Fenster, das es geöffnet hat. */
function parentHandoff(): PrintHandoff | null {
  if (window.parent === window) {
    return null;
  }
  try {
    return (window.parent as HandoffWindow)[HANDOFF_KEY] ?? null;
  } catch {
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rendert die Druck-Route in einem versteckten A4-iframe und öffnet den Druckdialog des Browsers („Als PDF speichern“).
 * Liefert immer `false`, weil der Browser nicht verrät, ob tatsächlich gespeichert wurde.
 */
async function printInFrame(job: PrintJob, photos: ReadonlyMap<string, string>): Promise<boolean> {
  const host = window as HandoffWindow;
  const failed = uiText(job.data.template.language).pdfFailed;
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  Object.assign(frame.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '210mm',
    height: '297mm',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  });
  try {
    // Warten, bis die Druckseite im iframe `signalPrintReady()` meldet; nach 20 s gilt der Export als fehlgeschlagen.
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
      frame.src = `${location.href.split('#')[0]}#/print`;
      document.body.append(frame);
    });
    const view = frame.contentWindow;
    if (!view) {
      throw new Error(failed);
    }
    // Der Dokumenttitel wird vom Browser als Dateiname-Vorschlag für das PDF verwendet.
    view.document.title = suggestFileBase(job.data);
    // Das Ende des Dialogs ist nicht zuverlässig erkennbar: `afterprint`, erneuter Fokus oder spätestens 60 s.
    const closed = new Promise<void>((resolve) => view.addEventListener('afterprint', () => resolve(), { once: true }));
    const refocused = new Promise<void>((resolve) => window.addEventListener('focus', () => resolve(), { once: true }));
    view.focus();
    view.print();
    await Promise.race([closed, refocused, delay(60000)]);
    return false;
  } finally {
    delete host[HANDOFF_KEY];
    frame.remove();
  }
}

/** Öffnet die Dateiauswahl des Browsers; `null`, wenn abgebrochen wurde. */
function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => resolve(null), { once: true });
    input.click();
  });
}

/** Skaliert auf höchstens 800 px Kantenlänge und speichert neu als PNG – wie die Fotoablage der Desktop-App. */
async function toPngDataUrl(source: Blob, language: CvLanguage): Promise<string> {
  const unreadable = uiText(language).photoUnreadable;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    throw new Error(unreadable);
  }
  const edge = Math.max(bitmap.width, bitmap.height);
  const scale = edge > MAX_PHOTO_EDGE ? MAX_PHOTO_EDGE / edge : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error(unreadable);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    throw new Error(unreadable);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(unreadable));
    reader.readAsDataURL(blob);
  });
}

/** Löst einen Datei-Download im Browser aus (für die Sicherungsdatei). */
function download(filename: string, contents: Blob): void {
  const url = URL.createObjectURL(contents);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CV-Studio in einem normalen Browser-Tab: Daten und Fotos bleiben in IndexedDB, bis die Nutzerin sie löscht. */
export function createBrowserCvApi(): CvApi {
  const ready: Promise<BrowserStore> = openBrowserStore();

  // Im Druck-iframe ist das Foto evtl. nicht im eigenen Speicher, dann kommt es aus der Übergabe des Editors.
  const readPhoto = async (fileName: string): Promise<string | null> => {
    const store = await ready;
    return (await store.get<string>(photoKey(fileName))) ?? parentHandoff()?.photos.get(fileName) ?? null;
  };

  const storePhoto = async (dataUrl: string): Promise<PhotoImportResult> => {
    const fileName = `${crypto.randomUUID()}.png`;
    await (await ready).set(photoKey(fileName), dataUrl);
    return { fileName, dataUrl };
  };

  // Sprache des gespeicherten Lebenslaufs, damit Fehlermeldungen in der passenden Sprache erscheinen.
  const currentLanguage = async (): Promise<CvLanguage> => {
    try {
      return migrate((await (await ready).get(CV_KEY)) ?? null).template.language;
    } catch {
      return 'de';
    }
  };

  return {
    ping: () => Promise.resolve({ ok: true }),
    load: async () => migrate((await (await ready).get(CV_KEY)) ?? null),
    save: async (next) => {
      await (await ready).set(CV_KEY, migrate(next));
    },
    importBackup: async (): Promise<BackupImport | null> => {
      const file = await pickFile('application/json,.json');
      if (!file) {
        return null;
      }
      const language = await currentLanguage();
      if (file.size > MAX_BACKUP_BYTES) {
        throw new Error(uiText(language).backupTooLarge);
      }
      const parsed = parseBackup(await file.text(), language);
      // Eingebettetes Foto neu ablegen; sonst ein bereits gespeichertes Foto mit gleichem Namen weiterverwenden.
      let photo: PhotoImportResult | null = null;
      if (parsed.photoDataUrl) {
        photo = await toPngDataUrl(dataUrlToBlob(parsed.photoDataUrl), language)
          .then((dataUrl) => storePhoto(dataUrl))
          .catch(() => null);
      } else if (parsed.data.personal.photoFile) {
        const dataUrl = await readPhoto(parsed.data.personal.photoFile);
        photo = dataUrl ? { fileName: parsed.data.personal.photoFile, dataUrl } : null;
      }
      return { data: { ...parsed.data, personal: { ...parsed.data.personal, photoFile: photo?.fileName ?? '' } }, photo };
    },
    exportBackup: async (payload) => {
      const data = migrate(payload);
      const photo = data.personal.photoFile ? await readPhoto(data.personal.photoFile) : null;
      download(backupFileName(data.template.language), new Blob([serializeBackup(createBackup(data, photo))], { type: 'application/json' }));
      return true;
    },
    importPhoto: async (): Promise<PhotoImportResult | null> => {
      const file = await pickFile('image/jpeg,image/png,image/webp');
      if (!file) {
        return null;
      }
      return storePhoto(await toPngDataUrl(file, await currentLanguage()));
    },
    readPhoto,
    removePhoto: async (fileName) => {
      await (await ready).delete(photoKey(fileName));
    },
    exportPdf: async (request) => {
      const fileName = request.data.personal.photoFile;
      const photo = fileName ? await readPhoto(fileName) : null;
      const photos = new Map<string, string>(fileName && photo ? [[fileName, photo]] : []);
      // Kopie, damit spätere Änderungen im Editor den laufenden Druckauftrag nicht beeinflussen.
      return printInFrame(structuredClone(request), photos);
    },
    takePrintJob: () => Promise.resolve(parentHandoff()?.job ?? null),
    signalPrintReady: () => {
      parentHandoff()?.ready();
      return Promise.resolve();
    },
    prepareForClose: () => undefined,
  };
}

// Gemeinsame Umsetzung von `CvApi` ohne Electron: Browser (Entwicklung) und Mobile-App (Capacitor).
// Daten und Fotos liegen in einem Schlüssel-Wert-Speicher; Dateiauswahl über <input type="file">.
// Was je Plattform verschieden ist (Speicher, Datei ausgeben, PDF erzeugen), liefert ein `WebPlatform`.
import { MAX_BACKUP_BYTES, backupFileName, createBackup, parseBackup, serializeBackup } from '@shared/cv/backup';
import type { CvLanguage } from '@shared/cv/cv-data';
import { CvLibraryService, DEFAULT_CV_ID, type CvDocumentStore } from '@shared/cv/cv-library';
import { migrate } from '@shared/cv/cv-migrate';
import type { BackupImport, CvApi, PhotoImportResult, PrintJob } from '@shared/ipc/ipc-api';
import { uiText } from '@shared/i18n/ui-text';
import type { BrowserStore } from './browser-store';
import { dataUrlToBlob } from './data-url';

const LIBRARY_KEY = 'library';
/** Schlüssel des ersten Lebenslaufs; entspricht dem Speicherort früherer Versionen. */
const CV_KEY = 'cv';
const MAX_PHOTO_EDGE = 800;

/** Übergabe vom Editor an die Druckansicht: Auftrag, Fotos und Rückmeldung „fertig gerendert“. */
export interface PrintHandoff {
  job: PrintJob;
  photos: ReadonlyMap<string, string>;
  ready: () => void;
}

/** Was je Plattform verschieden ist. */
export interface WebPlatform {
  /** Schlüssel-Wert-Speicher für Verzeichnis, Lebensläufe und Fotos. */
  store: Promise<BrowserStore>;
  /** Gibt eine erzeugte Datei aus (Download bzw. Teilen-Dialog); `true` = sicher ausgegeben. */
  deliverFile(fileName: string, contents: Blob, language: CvLanguage): Promise<boolean>;
  /** Rendert den Druckauftrag und erzeugt daraus ein PDF; `true` = gespeichert oder geteilt. */
  printPdf(job: PrintJob, photos: ReadonlyMap<string, string>): Promise<boolean>;
  /** Liefert in der Druckansicht die Übergabe des Editors; `null` außerhalb der Druckansicht. */
  handoff(): PrintHandoff | null;
}

/** Speicherschlüssel eines Fotos. */
function photoKey(fileName: string): string {
  return `photo:${fileName}`;
}

/** Speicherschlüssel eines Lebenslaufs. */
function cvKey(id: string): string {
  return id === DEFAULT_CV_ID ? CV_KEY : `cv:${id}`;
}

/** Öffnet die Dateiauswahl; `null`, wenn abgebrochen wurde. */
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

/** `CvApi` über einem Schlüssel-Wert-Speicher; Daten bleiben auf dem Gerät, bis die Nutzerin sie löscht. */
export function createWebCvApi(platform: WebPlatform): CvApi {
  const ready = platform.store;
  let language: CvLanguage = 'de';

  // In der Druckansicht ist das Foto evtl. nicht im eigenen Speicher, dann kommt es aus der Übergabe des Editors.
  const readPhoto = async (fileName: string): Promise<string | null> => {
    const store = await ready;
    return (await store.get<string>(photoKey(fileName))) ?? platform.handoff()?.photos.get(fileName) ?? null;
  };

  const storePhoto = async (dataUrl: string): Promise<PhotoImportResult> => {
    const fileName = `${crypto.randomUUID()}.png`;
    await (await ready).set(photoKey(fileName), dataUrl);
    return { fileName, dataUrl };
  };

  const documents: CvDocumentStore = {
    readLibrary: async () => (await ready).get(LIBRARY_KEY),
    writeLibrary: async (library) => (await ready).set(LIBRARY_KEY, library),
    readCv: async (id) => (await ready).get(cvKey(id)),
    writeCv: async (id, data) => (await ready).set(cvKey(id), data),
    deleteCv: async (id) => (await ready).delete(cvKey(id)),
    copyPhoto: async (fileName) => {
      const dataUrl = await readPhoto(fileName);
      return dataUrl ? (await storePhoto(dataUrl)).fileName : null;
    },
    removePhoto: async (fileName) => (await ready).delete(photoKey(fileName)),
  };
  const library = new CvLibraryService(documents, () => language);

  // Sprache des aktiven Lebenslaufs, damit Fehlermeldungen in der passenden Sprache erscheinen.
  const currentLanguage = async (): Promise<CvLanguage> => {
    try {
      language = (await library.load()).template.language;
    } catch {
      // Zuletzt bekannte Sprache behalten.
    }
    return language;
  };

  return {
    ping: () => Promise.resolve({ ok: true }),
    load: async () => {
      const data = await library.load();
      language = data.template.language;
      return data;
    },
    save: async (next) => {
      language = next.template.language;
      await library.save(next);
    },
    library: () => library.library(),
    switchCv: (id) => library.switchTo(id),
    createCv: (name, data) => library.create(name, data),
    duplicateCv: (id, name) => library.duplicate(id, name),
    renameCv: (id, name) => library.rename(id, name),
    deleteCv: (id) => library.remove(id),
    resetAll: async (template) => {
      await library.reset(template);
    },
    importBackup: async (): Promise<BackupImport | null> => {
      const file = await pickFile('application/json,.json');
      if (!file) {
        return null;
      }
      const importLanguage = await currentLanguage();
      if (file.size > MAX_BACKUP_BYTES) {
        throw new Error(uiText(importLanguage).backupTooLarge);
      }
      const parsed = parseBackup(await file.text(), importLanguage);
      // Eingebettetes Foto neu ablegen; sonst ein bereits gespeichertes Foto mit gleichem Namen übernehmen.
      let photo: PhotoImportResult | null = null;
      if (parsed.photoDataUrl) {
        photo = await toPngDataUrl(dataUrlToBlob(parsed.photoDataUrl), importLanguage)
          .then((dataUrl) => storePhoto(dataUrl))
          .catch(() => null);
      } else if (parsed.data.personal.photoFile) {
        // Als Kopie ablegen: Das Foto könnte zu einem anderen Lebenslauf gehören und mit ihm gelöscht werden.
        const dataUrl = await readPhoto(parsed.data.personal.photoFile);
        photo = dataUrl ? await storePhoto(dataUrl) : null;
      }
      return { data: { ...parsed.data, personal: { ...parsed.data.personal, photoFile: photo?.fileName ?? '' } }, photo };
    },
    exportBackup: async (payload) => {
      const data = migrate(payload);
      const photo = data.personal.photoFile ? await readPhoto(data.personal.photoFile) : null;
      const contents = new Blob([serializeBackup(createBackup(data, photo))], { type: 'application/json' });
      return platform.deliverFile(backupFileName(data.template.language), contents, data.template.language);
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
      return platform.printPdf(structuredClone(request), photos);
    },
    takePrintJob: () => Promise.resolve(platform.handoff()?.job ?? null),
    signalPrintReady: () => {
      platform.handoff()?.ready();
      return Promise.resolve();
    },
    prepareForClose: () => undefined,
  };
}

// IPC-Schicht des Hauptprozesses: registriert alle `ipcMain.handle`-Endpunkte (Laden, Speichern,
// Sicherung, Foto, PDF) und den Schließ-Schutz. Alle Eingaben aus dem Renderer werden hier validiert.
import { dialog, ipcMain, type BrowserWindow } from 'electron';
import { readFile, stat } from 'node:fs/promises';
import { MAX_BACKUP_BYTES, backupFileName, createBackup, parseBackup, serializeBackup } from '../../shared/cv/backup';
import type { CvLanguage } from '../../shared/cv/cv-data';
import { CvValidationError, migrate } from '../../shared/cv/cv-migrate';
import type { BackupImport, PhotoImportResult } from '../../shared/ipc/ipc-api';
import { IpcChannels } from '../../shared/ipc/ipc-channels';
import { parsePhotoFileName, parsePrintJob } from '../../shared/ipc/ipc-parse';
import { uiText } from '../../shared/i18n/ui-text';
import { writeAtomic } from '../services/atomic-file';
import { CvLibraryService } from '../../shared/cv/cv-library';
import { createFileStore } from '../services/cv-store';
import { exportPdf, markPrintReady, securePreferences, takePrintJob } from '../services/pdf-export';
import { importPhotoDataUrl, importPhotoFile, readPhotoDataUrl, removePhotoFile } from '../services/photo-store';

/** Umgebung, die `main.ts` den Handlern mitgibt. */
export interface IpcHost {
  /** userData-Ordner der App (enthält cv-data.json und den Fotoordner). */
  userData: string;
  /** Dev-Server-Origin oder `null` im Produktionsmodus. */
  devServerUrl: string | null;
  /** Pfad zum kompilierten Preload-Skript, auch für das Druckfenster benötigt. */
  preloadPath: string;
  /** Liefert das aktuelle Hauptfenster als Eltern für modale Dialoge. */
  getParentWindow: () => BrowserWindow | null;
}

/** Öffnen-Dialog, modal zum Elternfenster, falls vorhanden. */
async function openDialog(parent: BrowserWindow | null, options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
  return parent ? dialog.showOpenDialog(parent, options) : dialog.showOpenDialog(options);
}

/** Speichern-Dialog, modal zum Elternfenster, falls vorhanden. */
async function saveDialog(parent: BrowserWindow | null, options: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> {
  return parent ? dialog.showSaveDialog(parent, options) : dialog.showSaveDialog(options);
}

/** Liest die Oberflächensprache defensiv aus ungeprüften Lebenslaufdaten; Standard ist Deutsch. */
function languageOf(payload: unknown): CvLanguage {
  if (typeof payload === 'object' && payload !== null && 'template' in payload) {
    const language = (payload as { template?: { language?: unknown } }).template?.language;
    if (language === 'de' || language === 'en' || language === 'tr') {
      return language;
    }
  }
  return 'de';
}


/**
 * Registriert alle IPC-Handler einmalig beim App-Start. Daten vom Renderer gelten als
 * nicht vertrauenswürdig und werden vor jeder Verwendung migriert bzw. geparst.
 */
export function registerIpcHandlers(host: IpcHost): void {
  // Zuletzt bekannte Oberflächensprache; bestimmt Standardnamen und Meldungen der Lebenslauf-Verwaltung.
  let language: CvLanguage = 'de';
  const library = new CvLibraryService(createFileStore(host.userData), () => language);
  /** Sprache des aktiven Lebenslaufs (für Dialogtexte); bei Lesefehlern die zuletzt bekannte. */
  const currentLanguage = async (): Promise<CvLanguage> => {
    try {
      language = (await library.load()).template.language;
    } catch {
      // Zuletzt bekannte Sprache behalten.
    }
    return language;
  };

  // Verbindungstest: bestätigt, dass die Preload-Brücke funktioniert.
  ipcMain.handle(IpcChannels.ping, () => ({ ok: true }));

  // Lädt den aktiven Lebenslauf (oder einen leeren, falls noch keine Datei existiert).
  ipcMain.handle(IpcChannels.load, async () => {
    const data = await library.load();
    language = data.template.language;
    return data;
  });

  // Validiert die Daten und speichert sie atomar in die Datei des aktiven Lebenslaufs.
  ipcMain.handle(IpcChannels.save, (_event, payload: unknown) => {
    language = languageOf(payload);
    return library.save(payload);
  });

  // Lebenslauf-Verwaltung: Kennungen, Namen und Daten prüft der Dienst selbst.
  ipcMain.handle(IpcChannels.library, () => library.library());
  ipcMain.handle(IpcChannels.switchCv, (_event, id: unknown) => library.switchTo(id));
  ipcMain.handle(IpcChannels.createCv, (_event, name: unknown, payload: unknown) => library.create(name, payload));
  ipcMain.handle(IpcChannels.duplicateCv, (_event, id: unknown, name: unknown) => library.duplicate(id, name));
  ipcMain.handle(IpcChannels.renameCv, (_event, id: unknown, name: unknown) => library.rename(id, name));
  ipcMain.handle(IpcChannels.deleteCv, (_event, id: unknown) => library.remove(id));
  ipcMain.handle(IpcChannels.resetAll, async (_event, template: unknown) => {
    await library.reset(migrate({ template }).template);
  });

  // JSON-Sicherung per Dialog einlesen; ein enthaltenes Foto wird in den Fotoordner übernommen.
  // cv-data.json wird hier nicht geschrieben – das Ergebnis geht an den Renderer zurück. `null` = abgebrochen.
  ipcMain.handle(IpcChannels.importBackup, async (): Promise<BackupImport | null> => {
    const importLanguage = await currentLanguage();
    const copy = uiText(importLanguage);
    const result = await openDialog(host.getParentWindow(), {
      title: copy.dialogImport,
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const selected = result.filePaths[0];
    if (!selected) {
      return null;
    }
    // Größe vor dem Einlesen prüfen, damit riesige Dateien nicht komplett in den Speicher geladen werden.
    const info = await stat(selected);
    if (info.size > MAX_BACKUP_BYTES) {
      throw new CvValidationError(copy.backupTooLarge);
    }
    const parsed = parseBackup(await readFile(selected, 'utf8'), importLanguage);
    // Foto aus der Sicherung neu speichern; sonst auf eine bereits lokal vorhandene Fotodatei zurückgreifen.
    // Ein Fehler beim Foto bricht den Import nicht ab – der Lebenslauf kommt dann ohne Foto.
    let photo: PhotoImportResult | null = null;
    if (parsed.photoDataUrl) {
      photo = await importPhotoDataUrl(host.userData, parsed.photoDataUrl).catch(() => null);
    } else if (parsed.data.personal.photoFile) {
      // Als Kopie ablegen: Das Foto könnte zu einem anderen Lebenslauf gehören und mit ihm gelöscht werden.
      const dataUrl = await readPhotoDataUrl(host.userData, parsed.data.personal.photoFile);
      photo = dataUrl ? await importPhotoDataUrl(host.userData, dataUrl).catch(() => null) : null;
    }
    // `photoFile` muss zum tatsächlich wiederhergestellten Foto passen (leer, wenn keins).
    return { data: { ...parsed.data, personal: { ...parsed.data.personal, photoFile: photo?.fileName ?? '' } }, photo };
  });

  // Lebenslauf inkl. Foto (als Data-URL) über einen Speichern-Dialog als JSON-Sicherung exportieren.
  // `true` = gespeichert, `false` = abgebrochen.
  ipcMain.handle(IpcChannels.exportBackup, async (_event, payload: unknown) => {
    const data = migrate(payload);
    const exportLanguage = languageOf(payload);
    const result = await saveDialog(host.getParentWindow(), {
      title: uiText(exportLanguage).dialogExport,
      defaultPath: backupFileName(exportLanguage),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) {
      return false;
    }
    const photo = data.personal.photoFile ? await readPhotoDataUrl(host.userData, data.personal.photoFile) : null;
    await writeAtomic(result.filePath, serializeBackup(createBackup(data, photo)));
    return true;
  });

  // Bild per Dialog auswählen, verkleinern und als PNG im Fotoordner ablegen. `null` = abgebrochen.
  ipcMain.handle(IpcChannels.importPhoto, async () => {
    const copy = uiText(await currentLanguage());
    const result = await openDialog(host.getParentWindow(), {
      title: copy.dialogPhoto,
      properties: ['openFile'],
      filters: [{ name: copy.dialogImages, extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const selected = result.filePaths[0];
    if (!selected) {
      return null;
    }
    return importPhotoFile(host.userData, selected);
  });

  // Gespeichertes Foto als Data-URL liefern (`null`, wenn Name leer/ungültig oder Datei fehlt).
  ipcMain.handle(IpcChannels.readPhoto, (_event, payload: unknown) => {
    const fileName = parsePhotoFileName(payload);
    if (!fileName) {
      return null;
    }
    return readPhotoDataUrl(host.userData, fileName);
  });

  // Fotodatei löschen; der Dateiname wird streng geprüft, damit nichts außerhalb des Fotoordners gelöscht wird.
  ipcMain.handle(IpcChannels.removePhoto, (_event, payload: unknown) => {
    return removePhotoFile(host.userData, parsePhotoFileName(payload));
  });

  // Validierten Druckauftrag im versteckten Druckfenster als PDF rendern und per Dialog speichern.
  ipcMain.handle(IpcChannels.exportPdf, (_event, payload: unknown) => {
    return exportPdf({
      parent: host.getParentWindow(),
      devServerUrl: host.devServerUrl,
      preloadPath: host.preloadPath,
      job: parsePrintJob(payload),
    });
  });

  // Druckansicht holt sich den wartenden Auftrag ab; die Absender-URL bestimmt, ob das erlaubt ist.
  ipcMain.handle(IpcChannels.takePrintJob, (event) => takePrintJob(event.sender.getURL()));

  // Druckansicht meldet „fertig gerendert“ – erst dann wird printToPDF ausgeführt.
  ipcMain.handle(IpcChannels.printReady, (event) => {
    markPrintReady(event.sender.getURL());
  });
}

/**
 * Schließ-Schutz fürs Hauptfenster: hält das Schließen an, bittet den Renderer per
 * `prepareClose`, ungespeicherte Änderungen zu sichern, und schließt nach Bestätigung
 * oder spätestens nach 3 Sekunden wirklich.
 */
export function registerCloseGuard(win: BrowserWindow): void {
  let allowClose = false;
  let closing = false;
  win.on('close', (event) => {
    if (allowClose) {
      return;
    }
    // Lädt die Seite noch, gibt es keinen Renderer, der antworten könnte – sofort schließen.
    if (win.webContents.isLoading()) {
      allowClose = true;
      return;
    }
    event.preventDefault();
    // Wiederholte Schließversuche während des Speicherns ignorieren.
    if (closing) {
      return;
    }
    closing = true;
    // Zeitlimit, damit ein hängender Renderer das Beenden nicht dauerhaft blockiert.
    const done = new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      ipcMain.once(IpcChannels.prepareCloseDone, () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    win.webContents.send(IpcChannels.prepareClose);
    void done.finally(() => {
      allowClose = true;
      if (!win.isDestroyed()) {
        win.close();
      }
    });
  });
}

/** Weitergereicht aus `pdf-export`, damit `main.ts` dieselben sicheren webPreferences fürs Hauptfenster nutzt. */
export { securePreferences };

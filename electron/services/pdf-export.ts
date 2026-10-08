// PDF-Export im Hauptprozess: öffnet ein verstecktes Druckfenster mit der Route `#/print`,
// übergibt ihm den Druckauftrag, wartet auf „bereit“, erzeugt per printToPDF ein A4-PDF und speichert es.
import { BrowserWindow, dialog } from 'electron';
import { writeFile } from 'node:fs/promises';
import { suggestFileBase } from '../../shared/format/file-name';
import { uiText } from '../../shared/i18n/ui-text';
import type { PrintJob } from '../../shared/ipc/ipc-api';
import { appUrl, isPrintDocument } from '../security';

/** Auftrag, den das Druckfenster einmalig abholen darf (zwischen Start und Abholung gesetzt). */
let pendingJob: PrintJob | null = null;
/** Callbacks des laufenden Exports: Druckansicht fertig gerendert bzw. Fehler/Zeitüberschreitung. */
let readyResolve: (() => void) | null = null;
let readyReject: ((error: Error) => void) | null = null;

/**
 * Gibt den wartenden Druckauftrag an die Druckansicht heraus und leert ihn danach (nur einmal abholbar).
 * Andere Absender als `#/print` erhalten `null`.
 */
export function takePrintJob(senderUrl: string): PrintJob | null {
  if (!isPrintDocument(senderUrl)) {
    return null;
  }
  const job = pendingJob;
  pendingJob = null;
  return job;
}

/** Signal der Druckansicht, dass der Lebenslauf fertig gerendert ist; nur aus `#/print` erlaubt, sonst Fehler. */
export function markPrintReady(senderUrl: string): void {
  if (!isPrintDocument(senderUrl)) {
    throw new Error('Dieser Aufruf ist nur in der Druckansicht erlaubt.');
  }
  readyResolve?.();
}

/**
 * Sichere webPreferences für alle App-Fenster: Kontextisolation, Sandbox, kein Node.js im Renderer,
 * Web-Security an. Der Zugriff auf den Hauptprozess läuft nur über das Preload-Skript.
 */
function securePreferences(preloadPath: string): Electron.WebPreferences {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    preload: preloadPath,
    webSecurity: true,
    allowRunningInsecureContent: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
  };
}

/**
 * Rendert den Lebenslauf in einem unsichtbaren Fenster (A4-Maße in Pixeln bei 96 dpi) und speichert das PDF
 * über einen Speichern-Dialog. `true` = gespeichert, `false` = abgebrochen. Nach 20 s ohne „bereit“
 * wird mit Fehler abgebrochen; das Druckfenster wird in jedem Fall wieder zerstört.
 */
export async function exportPdf(options: {
  parent: BrowserWindow | null;
  devServerUrl: string | null;
  preloadPath: string;
  job: PrintJob;
}): Promise<boolean> {
  pendingJob = options.job;
  const win = new BrowserWindow({
    show: false,
    width: 794,
    height: 1123,
    backgroundColor: '#ffffff',
    skipTaskbar: true,
    webPreferences: securePreferences(options.preloadPath),
  });
  let timer: NodeJS.Timeout | null = null;
  const ready = new Promise<void>((resolve, reject) => {
    readyResolve = () => {
      if (timer) {
        clearTimeout(timer);
      }
      resolve();
    };
    readyReject = (error: Error) => {
      if (timer) {
        clearTimeout(timer);
      }
      reject(error);
    };
    timer = setTimeout(() => {
      readyReject?.(new Error('Zeitüberschreitung beim PDF-Export.'));
    }, 20000);
  });

  try {
    // Stürzt der Renderer ab, sofort mit Fehler beenden statt auf das Zeitlimit zu warten.
    win.webContents.once('render-process-gone', () => {
      readyReject?.(new Error('Die Druckansicht wurde unerwartet beendet.'));
    });
    await win.loadURL(appUrl(options.devServerUrl, '/print'));
    // Erst drucken, wenn die Druckansicht fertig gerendert hat und `markPrintReady` auslöst.
    await ready;
    const pdf = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    const dialogOptions = {
      title: uiText(options.job.options.language).dialogPdf,
      defaultPath: `${suggestFileBase(options.job.data)}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    };
    const result = options.parent
      ? await dialog.showSaveDialog(options.parent, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) {
      return false;
    }
    await writeFile(result.filePath, pdf);
    return true;
  } finally {
    // Globalen Zustand zurücksetzen, damit ein späterer Export sauber startet.
    if (timer) {
      clearTimeout(timer);
    }
    readyResolve = null;
    readyReject = null;
    pendingJob = null;
    if (!win.isDestroyed()) {
      win.destroy();
    }
  }
}

/** Auch für das Hauptfenster verwendet (über `ipc/handlers` an `main.ts` weitergereicht). */
export { securePreferences };

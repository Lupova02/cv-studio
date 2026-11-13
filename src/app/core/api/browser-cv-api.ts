// Browser-Ersatz für die Electron-API (nur Entwicklungsmodus): Daten und Fotos in IndexedDB,
// Sicherung als Download, PDF-Export über den Druckdialog eines versteckten iframes.
import { suggestFileBase } from '@shared/format/file-name';
import type { CvApi, PrintJob } from '@shared/ipc/ipc-api';
import { uiText } from '@shared/i18n/ui-text';
import { openBrowserStore } from './browser-store';
import { createWebCvApi, type PrintHandoff } from './web-cv-api';

/** Name der Eigenschaft am Editor-Fenster, über die das Druck-iframe seinen Auftrag abholt. */
const HANDOFF_KEY = '__cvPrintHandoff';

type HandoffWindow = Window & { [HANDOFF_KEY]?: PrintHandoff };

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

/** Löst einen Datei-Download im Browser aus (für die Sicherungsdatei). */
function download(filename: string, contents: Blob): Promise<boolean> {
  const url = URL.createObjectURL(contents);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Promise.resolve(true);
}

/** CV-Studio in einem normalen Browser-Tab: Daten und Fotos bleiben in IndexedDB, bis die Nutzerin sie löscht. */
export function createBrowserCvApi(): CvApi {
  return createWebCvApi({
    store: openBrowserStore(),
    deliverFile: (fileName, contents) => download(fileName, contents),
    printPdf: printInFrame,
    handoff: parentHandoff,
  });
}

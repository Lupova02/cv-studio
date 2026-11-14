// Preload-Brücke zwischen Angular-Oberfläche und Hauptprozess: stellt über contextBridge
// genau die typisierten Funktionen aus `CvApi` als `window.cvApi` bereit – kein direkter IPC-Zugriff.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { CvData, TemplateSettings } from '../shared/cv/cv-data';
import type { CvApi, MenuCommand, PrintJob } from '../shared/ipc/ipc-api';

/** Erlaubte Menübefehle; bewusst hier wiederholt, weil der Preload in der Sandbox nur `electron` laden kann. */
const MENU_COMMANDS: readonly string[] = ['export-pdf', 'export-backup', 'import-backup', 'undo', 'redo', 'quality', 'toggle-sample', 'cycle-theme'];

/**
 * Implementierung von `CvApi`: jede Methode ruft fest einen einzelnen IPC-Kanal auf.
 * Die Kanalnamen stehen bewusst als Literale da (keine generische Weiterleitung beliebiger Kanäle).
 */
const api: CvApi = {
  ping: () => ipcRenderer.invoke('cv:ping'),
  load: () => ipcRenderer.invoke('cv:load'),
  save: (data: CvData) => ipcRenderer.invoke('cv:save', data),
  library: () => ipcRenderer.invoke('cv:library'),
  switchCv: (id: string) => ipcRenderer.invoke('cv:switch', id),
  createCv: (name: string, data: CvData | null) => ipcRenderer.invoke('cv:create', name, data),
  duplicateCv: (id: string, name: string) => ipcRenderer.invoke('cv:duplicate', id, name),
  renameCv: (id: string, name: string) => ipcRenderer.invoke('cv:rename', id, name),
  deleteCv: (id: string) => ipcRenderer.invoke('cv:delete', id),
  resetAll: (template: TemplateSettings) => ipcRenderer.invoke('cv:reset', template),
  importBackup: () => ipcRenderer.invoke('cv:import-backup'),
  exportBackup: (data: CvData) => ipcRenderer.invoke('cv:export-backup', data),
  importPhoto: () => ipcRenderer.invoke('cv:import-photo'),
  readPhoto: (fileName: string) => ipcRenderer.invoke('cv:read-photo', fileName),
  removePhoto: (fileName: string) => ipcRenderer.invoke('cv:remove-photo', fileName),
  exportPdf: (request: PrintJob) => ipcRenderer.invoke('cv:export-pdf', request),
  takePrintJob: () => ipcRenderer.invoke('cv:take-print-job'),
  signalPrintReady: () => ipcRenderer.invoke('cv:print-ready'),
  // Vor dem Schließen fragt der Hauptprozess nach; `save` läuft, danach wird immer – auch bei Fehler – „fertig“ gemeldet.
  prepareForClose: (save: () => Promise<void>) => {
    ipcRenderer.on('cv:prepare-close', (_event: IpcRendererEvent) => {
      void Promise.resolve()
        .then(() => save())
        .finally(() => {
          ipcRenderer.send('cv:prepare-close-done');
        });
    });
  },
  // Menüleiste: nur bekannte Befehle weiterreichen.
  onMenuCommand: (listener: (command: MenuCommand) => void) => {
    ipcRenderer.on('cv:menu-command', (_event: IpcRendererEvent, command: unknown) => {
      if (typeof command === 'string' && MENU_COMMANDS.includes(command)) {
        listener(command as MenuCommand);
      }
    });
  },
};

// Bei contextIsolation die einzige Verbindung der Seite zum Hauptprozess.
contextBridge.exposeInMainWorld('cvApi', api);

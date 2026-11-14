// Namen der IPC-Kanäle zwischen Electron-Hauptprozess und Oberfläche (über den Preload).
// Der Hauptprozess registriert seine Handler unter diesen Namen.

/**
 * Alle IPC-Kanalnamen. Die meisten sind Anfrage/Antwort-Kanäle (`invoke`/`handle`).
 * `prepareClose` und `menuCommand` schickt der Hauptprozess an das Fenster, `prepareCloseDone` ist die Antwort der Oberfläche.
 * electron/preload.ts schreibt die Namen direkt aus; Änderungen müssen dort nachgezogen werden.
 */
export const IpcChannels = {
  ping: 'cv:ping',
  load: 'cv:load',
  save: 'cv:save',
  library: 'cv:library',
  switchCv: 'cv:switch',
  createCv: 'cv:create',
  duplicateCv: 'cv:duplicate',
  renameCv: 'cv:rename',
  deleteCv: 'cv:delete',
  resetAll: 'cv:reset',
  importBackup: 'cv:import-backup',
  exportBackup: 'cv:export-backup',
  importPhoto: 'cv:import-photo',
  readPhoto: 'cv:read-photo',
  removePhoto: 'cv:remove-photo',
  exportPdf: 'cv:export-pdf',
  takePrintJob: 'cv:take-print-job',
  printReady: 'cv:print-ready',
  prepareClose: 'cv:prepare-close',
  prepareCloseDone: 'cv:prepare-close-done',
  /** Menüleiste → Oberfläche: ein Befehl aus `MenuCommand`. */
  menuCommand: 'cv:menu-command',
} as const;

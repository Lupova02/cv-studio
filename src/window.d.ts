// Globale Typerweiterung: macht die vom Electron-Preload bereitgestellte `window.cvApi` für TypeScript bekannt.
import type { CvApi } from '@shared/ipc/ipc-api';

declare global {
  interface Window {
    /** Desktop-Schnittstelle aus dem Preload; fehlt im reinen Browser. */
    cvApi?: CvApi;
  }
}

export {};

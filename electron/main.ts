// Einstiegspunkt des Electron-Hauptprozesses: registriert das eigene Protokoll cvstudio://,
// setzt CSP und Navigationsschutz, richtet IPC-Handler und Menü ein und öffnet das Hauptfenster.
import { app, BrowserWindow, Menu, protocol, session } from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { registerCloseGuard, registerIpcHandlers, securePreferences } from './ipc/handlers';
import { DEVELOPMENT_CSP, PRODUCTION_CSP, appUrl, devServerFromEnv, isNavigationAllowed } from './security';

app.setName('CV-Studio');

/** Origin des Angular-Dev-Servers (nur unverpackt und nur localhost), sonst `null` = Produktionsmodus. */
const devServerUrl = devServerFromEnv(app.isPackaged, process.env['CV_DEV_SERVER_URL']);

// Muss vor `app.whenReady()` geschehen. „standard“ + „secure“ geben cvstudio:// eine echte Origin
// wie bei https (nötig für fetch, Web Worker und WebAssembly); CORS bleibt deaktiviert.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'cvstudio',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false,
      stream: true,
    },
  },
]);

/** Zuordnung Dateiendung → Content-Type für die über cvstudio:// ausgelieferten App-Dateien. */
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

/** Das aktuell offene Hauptfenster (für Dialoge, Einzelinstanz-Fokus und macOS-Reaktivierung). */
let mainWindow: BrowserWindow | null = null;

/** Verzeichnis mit dem gebauten Angular-Frontend innerhalb des App-Pakets. */
function browserDirectory(): string {
  return path.join(app.getAppPath(), 'dist', 'cv-studio', 'browser');
}

/**
 * Übersetzt eine cvstudio://-Anfrage in einen Dateipfad im Frontend-Verzeichnis.
 * Liefert `null` bei kaputter URL oder wenn der Pfad (z. B. per `../`) aus dem Verzeichnis ausbrechen würde.
 */
function resolveAppFile(requestUrl: string): string | null {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(requestUrl).pathname);
  } catch {
    return null;
  }
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }
  const root = path.resolve(browserDirectory());
  const candidate = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, candidate);
  // Schutz vor Path-Traversal: nur Dateien unterhalb von `root` ausliefern.
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return candidate;
}

/**
 * Härtet jedes erzeugte WebContents: keine neuen Fenster (`window.open`), keine Navigation
 * außerhalb der App und keine `<webview>`-Einbettungen.
 */
function installNavigationGuard(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-navigate', (event, url) => {
      if (!isNavigationAllowed(url, devServerUrl)) {
        event.preventDefault();
      }
    });
    contents.on('will-attach-webview', (event) => {
      event.preventDefault();
    });
  });
}

/** Hängt an alle HTTP-Antworten der Standard-Session den CSP-Header (Dev- oder Produktions-Variante). */
function installContentSecurityPolicy(): void {
  const policy = devServerUrl ? DEVELOPMENT_CSP : PRODUCTION_CSP;
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [policy],
      },
    });
  });
}

/**
 * Liefert das gebaute Frontend über cvstudio://app/ aus (statt file://): nur GET/HEAD,
 * Pfadprüfung über `resolveAppFile`, passender MIME-Typ und die Produktions-CSP als Header.
 */
function registerAppProtocol(): void {
  protocol.handle('cvstudio', async (request) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }
    const filePath = resolveAppFile(request.url);
    if (!filePath) {
      return new Response('Forbidden', { status: 403 });
    }
    try {
      const body = await readFile(filePath);
      const type = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
      return new Response(body, {
        headers: {
          'Content-Type': type,
          'Content-Security-Policy': PRODUCTION_CSP,
        },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

/**
 * Erzeugt das Hauptfenster mit sicheren webPreferences und Preload-Skript, aktiviert den
 * Schließ-Schutz (Speichern vor dem Beenden) und zeigt das Fenster erst nach dem ersten Rendern.
 */
function createMainWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'CV-Studio',
    backgroundColor: '#e7e5e4',
    webPreferences: securePreferences(preloadPath),
  });
  mainWindow = win;
  registerCloseGuard(win);
  win.once('ready-to-show', () => {
    win.show();
  });
  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });
  void win.loadURL(appUrl(devServerUrl, '/'));
}

/** Minimales Anwendungsmenü: auf macOS App-, Bearbeiten- und Fenstermenü, sonst nur Bearbeiten (Kopieren/Einfügen). */
function installMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] =
    process.platform === 'darwin'
      ? [{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]
      : [{ role: 'editMenu' }];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Nur eine laufende Instanz zulassen, damit nicht zwei Prozesse gleichzeitig cv-data.json schreiben.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // Ein zweiter Startversuch holt stattdessen das vorhandene Fenster nach vorne.
  app.on('second-instance', () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  void app.whenReady().then(() => {
    installNavigationGuard();
    installContentSecurityPolicy();
    registerAppProtocol();
    installMenu();
    registerIpcHandlers({
      userData: app.getPath('userData'),
      devServerUrl,
      preloadPath: path.join(__dirname, 'preload.js'),
      getParentWindow: () => mainWindow,
    });
    createMainWindow();
    // macOS: Klick aufs Dock-Symbol ohne offenes Fenster öffnet ein neues Hauptfenster.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  // Auf macOS bleibt die App nach dem Schließen aller Fenster aktiv (Plattformkonvention).
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

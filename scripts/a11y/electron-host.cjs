// Electron-Hülle für die Barrierefreiheits-Prüfung: liefert den Dev-Build (ohne Preload → Browser-Speicher)
// über a11y:// aus. Wird von scripts/a11y/check.mjs über Playwright gestartet; nichts geht ins Netz.
const { app, BrowserWindow, protocol } = require('electron');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..', 'dist-a11y', 'browser');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.wasm': 'application/wasm' };

app.setPath('userData', path.join(app.getPath('temp'), 'cv-studio-a11y'));
protocol.registerSchemesAsPrivileged([{ scheme: 'a11y', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

void app.whenReady().then(() => {
  protocol.handle('a11y', async (request) => {
    let pathname = decodeURIComponent(new URL(request.url).pathname);
    if (pathname === '/' || pathname === '') pathname = '/index.html';
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root)) return new Response('Forbidden', { status: 403 });
    try {
      return new Response(await readFile(file), { headers: { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' } });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
  const win = new BrowserWindow({ width: 1280, height: 800 });
  void win.loadURL('a11y://app/');
});

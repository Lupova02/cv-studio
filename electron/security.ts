// Sicherheitsbausteine des Electron-Hauptprozesses: Content-Security-Policies,
// Prüfung der Dev-Server-Adresse, Navigationsschutz und Erzeugung der App-URLs.

/**
 * Strenge CSP für die ausgelieferte App (cvstudio://app/). Nur eigene Ressourcen, keine Frames/Formulare.
 * `'wasm-unsafe-eval'` ist nötig, damit die Offline-Übersetzung im Web Worker WebAssembly ausführen kann.
 * Muss identisch mit dem Meta-Tag in `src/index.prod.html` bleiben (wird per Test geprüft).
 */
export const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "worker-src 'self'",
].join('; ');

/**
 * Gelockerte CSP nur für die Entwicklung mit dem Angular-Dev-Server:
 * erlaubt Inline-/Eval-Skripte, blob:-Bilder und WebSocket/HTTP zu localhost (Live-Reload).
 */
export const DEVELOPMENT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' ws://127.0.0.1:* ws://localhost:* http://127.0.0.1:* http://localhost:*",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Prüft eine Dev-Server-Adresse: nur `http://` auf 127.0.0.1/localhost ohne Zugangsdaten.
 * Liefert die normalisierte Origin (z. B. `http://localhost:4200`) oder `null`, wenn unzulässig.
 */
export function sanitizeDevServer(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:') {
    return null;
  }
  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    return null;
  }
  if (url.username || url.password) {
    return null;
  }
  return url.origin;
}

/**
 * Ermittelt die Dev-Server-Origin aus der Umgebungsvariable. In der gepackten App immer `null`,
 * damit eine fertige Installation nie Inhalte von einem lokalen Server lädt.
 */
export function devServerFromEnv(isPackaged: boolean, envValue: string | undefined): string | null {
  if (isPackaged) {
    return null;
  }
  return sanitizeDevServer(envValue);
}

/**
 * Entscheidet, ob ein Fenster zu `url` navigieren darf: im Dev-Modus nur zur Dev-Server-Origin,
 * sonst ausschließlich innerhalb von `cvstudio://app`. Ungültige URLs werden abgelehnt.
 */
export function isNavigationAllowed(url: string, devServerUrl: string | null): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (devServerUrl) {
    return parsed.origin === devServerUrl;
  }
  return parsed.protocol === 'cvstudio:' && parsed.hostname === 'app';
}

/**
 * Baut die Start-URL eines Fensters; `hash` ist die Angular-Route (Hash-Routing, z. B. `/print`).
 * Im Dev-Modus zeigt sie auf den Dev-Server, sonst auf `cvstudio://app/index.html`.
 */
export function appUrl(devServerUrl: string | null, hash: string): string {
  const suffix = hash ? `#${hash}` : '';
  if (devServerUrl) {
    return `${devServerUrl}/${suffix}`;
  }
  return `cvstudio://app/index.html${suffix}`;
}

/**
 * Prüft, ob eine Absender-URL die Druckansicht (`#/print`) ist. Damit dürfen nur das versteckte
 * Druckfenster den Druckauftrag abholen und „bereit“ melden.
 */
export function isPrintDocument(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hash === '#/print' || parsed.hash.startsWith('#/print?');
  } catch {
    return false;
  }
}

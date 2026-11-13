// Erzeugt das App-Symbol in allen benötigten Varianten aus einer SVG-Zeichnung (npm run icons):
//   assets/icon.svg …                 Master-Zeichnung und Quellen für @capacitor/assets (Android adaptiv, iOS, Splash)
//   build/icon.png, build/icon.icns   Electron/electron-builder (macOS mit abgerundetem Quadrat und Rand)
//   public/favicon.svg                Symbol im Browser-Tab (Entwicklung)
// Danach erzeugt `npx capacitor-assets generate` die Android- und iOS-Größen.
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

// sharp kommt mit @capacitor/assets mit; so braucht das Skript keine eigene Abhängigkeit.
const require = createRequire(createRequire(import.meta.url).resolve('@capacitor/assets/package.json'));
const sharp = require('sharp');

const ROOT = path.resolve(import.meta.dirname, '..');
/** Akzentfarben der Oberfläche (siehe --accent in src/styles.scss) für den Verlauf. */
const TOP = '#3a68c4';
const BOTTOM = '#1f4288';
const INK = '#16233f';

/** Verlaufshintergrund als SVG-Definition. */
const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${TOP}"/>
      <stop offset="1" stop-color="${BOTTOM}"/>
    </linearGradient>
    <linearGradient id="fold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c9d7f5"/>
      <stop offset="1" stop-color="#9fb6e8"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0b1838" flood-opacity="0.35"/>
    </filter>
  </defs>`;

/**
 * Das Lebenslauf-Blatt im Raster 1024 × 1024, mittig bei (512, 512) und `scale` = 1 → ca. 560 px hoch:
 * Blatt mit Eselsohr, rundes Profilbild, Name, Textzeilen und ein Akzent-Häkchen als „fertig“-Signal.
 */
function documentArt(scale = 1) {
  return `
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)" filter="url(#shadow)">
    <path d="M318 232h282l126 126v412a40 40 0 0 1-40 40H318a40 40 0 0 1-40-40V272a40 40 0 0 1 40-40z" fill="#ffffff"/>
    <path d="M600 232l126 126h-86a40 40 0 0 1-40-40z" fill="url(#fold)"/>
    <circle cx="384" cy="386" r="58" fill="${TOP}"/>
    <circle cx="384" cy="372" r="22" fill="#ffffff"/>
    <path d="M346 424c8-24 22-34 38-34s30 10 38 34" fill="#ffffff"/>
    <rect x="470" y="352" width="150" height="26" rx="13" fill="${INK}"/>
    <rect x="470" y="398" width="108" height="18" rx="9" fill="#9aa9c6"/>
    <rect x="340" y="488" width="344" height="18" rx="9" fill="#c3cde0"/>
    <rect x="340" y="534" width="300" height="18" rx="9" fill="#c3cde0"/>
    <rect x="340" y="580" width="324" height="18" rx="9" fill="#c3cde0"/>
    <rect x="340" y="626" width="220" height="18" rx="9" fill="#c3cde0"/>
    <circle cx="676" cy="706" r="74" fill="#22a06b" stroke="#ffffff" stroke-width="16"/>
    <path d="M640 706l26 26 48-50" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs}${body}</svg>\n`;

/** Randloses Quadrat (iOS/Android maskieren selbst). */
const full = svg(`<rect width="1024" height="1024" fill="url(#bg)"/>${documentArt(1)}`);
/** Android adaptiv: Vordergrund nur im sicheren Kreis (66 %), Hintergrund nur Verlauf. */
const foreground = svg(documentArt(0.68));
const background = svg(`<rect width="1024" height="1024" fill="url(#bg)"/>`);
/** macOS: abgerundetes Quadrat mit Rand nach Apple-Raster (824 px Fläche, Radius ≈ 185 px). */
const mac = svg(`<rect x="100" y="100" width="824" height="824" rx="185" fill="url(#bg)"/>${documentArt(0.8)}`);

function pngBuffer(source, size) {
  return sharp(Buffer.from(source), { density: 72 * (size / 1024) * 4 }).resize(size, size).png().toBuffer();
}

async function png(source, size, target) {
  await writeFile(target, await pngBuffer(source, size));
}

/**
 * Baut eine .icns-Datei ohne iconutil: Kopf „icns“ + Gesamtlänge, danach je Größe ein Eintrag aus
 * 4-Zeichen-Typ, Länge und PNG-Daten (von macOS ab 10.7 für diese Typen unterstützt).
 */
async function icns(source) {
  const types = [
    ['ic07', 128],
    ['ic08', 256],
    ['ic09', 512],
    ['ic10', 1024],
    ['ic11', 32],
    ['ic12', 64],
    ['ic13', 256],
    ['ic14', 512],
  ];
  const entries = [];
  for (const [type, size] of types) {
    const data = await pngBuffer(source, size);
    const head = Buffer.alloc(8);
    head.write(type, 0, 'ascii');
    head.writeUInt32BE(data.length + 8, 4);
    entries.push(head, data);
  }
  const body = Buffer.concat(entries);
  const head = Buffer.alloc(8);
  head.write('icns', 0, 'ascii');
  head.writeUInt32BE(body.length + 8, 4);
  return Buffer.concat([head, body]);
}

/** Splash: Symbol mittig auf Verlauf bzw. dunklem Grund. */
function splash(dark) {
  const ground = dark ? `<rect width="2732" height="2732" fill="#0e1015"/>` : `<rect width="2732" height="2732" fill="${BOTTOM}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732" width="2732" height="2732">${ground}
    <g transform="translate(1066 1066) scale(0.586)">${mac.replace(/^<svg[^>]*>/, '').replace('</svg>\n', '')}</g></svg>`;
}

async function main() {
  const assets = path.join(ROOT, 'assets');
  const build = path.join(ROOT, 'build');
  await mkdir(assets, { recursive: true });
  await mkdir(build, { recursive: true });

  await writeFile(path.join(assets, 'icon.svg'), full);
  await writeFile(path.join(assets, 'icon-macos.svg'), mac);
  await writeFile(path.join(ROOT, 'public', 'favicon.svg'), mac);

  // Quellen für @capacitor/assets (Dateinamen sind dort festgelegt).
  await png(full, 1024, path.join(assets, 'icon-only.png'));
  await png(foreground, 1024, path.join(assets, 'icon-foreground.png'));
  await png(background, 1024, path.join(assets, 'icon-background.png'));
  await sharp(Buffer.from(splash(false))).png().toFile(path.join(assets, 'splash.png'));
  await sharp(Buffer.from(splash(true))).png().toFile(path.join(assets, 'splash-dark.png'));

  // Electron: 1024er PNG (Windows/Linux, Fenster) und .icns für macOS.
  await png(mac, 1024, path.join(build, 'icon.png'));
  await writeFile(path.join(build, 'icon.icns'), await icns(mac));
  console.log('App-Symbole erzeugt: assets/, build/icon.png, build/icon.icns, public/favicon.svg');
}

await main();

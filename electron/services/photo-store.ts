// Fotoablage des Hauptprozesses: importiert Bilder (Datei oder Data-URL aus einer Sicherung),
// verkleinert sie, speichert sie als PNG im userData-Fotoordner und liest/löscht sie wieder.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { nativeImage, type NativeImage } from 'electron';
import { CvValidationError } from '../../shared/cv/cv-migrate';
import {
  MAX_PHOTO_BYTES,
  MAX_PHOTO_EDGE,
  assertImportExtension,
  assertSafePhotoName,
  photoDirectory,
} from './photo-path';

/** Skaliert ein Bild proportional, sodass die längere Kante höchstens `MAX_PHOTO_EDGE` Pixel misst. */
function resize(image: NativeImage): NativeImage {
  const { width, height } = image.getSize();
  if (width <= 0 || height <= 0) {
    throw new CvValidationError('Die Bilddatei konnte nicht gelesen werden.');
  }
  const edge = Math.max(width, height);
  if (edge <= MAX_PHOTO_EDGE) {
    return image;
  }
  const scale = MAX_PHOTO_EDGE / edge;
  return image.resize({
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    quality: 'best',
  });
}

/**
 * Importiert eine vom Nutzer gewählte Bilddatei: prüft Endung, Dateityp und Größe (max. 15 MB)
 * und speichert sie über `storePhoto`. Liefert neuen Dateinamen und PNG-Data-URL für die Vorschau.
 */
export async function importPhotoFile(userData: string, sourcePath: string): Promise<{ fileName: string; dataUrl: string }> {
  assertImportExtension(sourcePath);
  const info = await stat(sourcePath);
  if (!info.isFile()) {
    throw new CvValidationError('Die Auswahl ist keine Datei.');
  }
  if (info.size > MAX_PHOTO_BYTES) {
    throw new CvValidationError('Das Bild darf höchstens 15 MB groß sein.');
  }
  return storePhoto(userData, await readFile(sourcePath));
}

/**
 * Speichert ein Foto aus einer Base64-Data-URL (z. B. aus einer JSON-Sicherung) als neue PNG-Datei.
 * Die Data-URL sollte vorher geprüft sein (siehe `isPhotoDataUrl`).
 */
export async function importPhotoDataUrl(userData: string, dataUrl: string): Promise<{ fileName: string; dataUrl: string }> {
  return storePhoto(userData, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
}

/**
 * Dekodiert Bilddaten, verkleinert sie und legt sie unter einem neuen `<UUID>.png` im Fotoordner ab.
 * Das Neukodieren als PNG verwirft Metadaten (z. B. EXIF/GPS) und ungültige Inhalte.
 */
async function storePhoto(userData: string, source: Buffer): Promise<{ fileName: string; dataUrl: string }> {
  const image = nativeImage.createFromBuffer(source);
  if (image.isEmpty()) {
    throw new CvValidationError('Die Bilddatei konnte nicht gelesen werden.');
  }
  const png = resize(image).toPNG();
  const fileName = `${randomUUID()}.png`;
  const directory = photoDirectory(userData);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), png);
  return { fileName, dataUrl: `data:image/png;base64,${png.toString('base64')}` };
}

/** Liest ein gespeichertes Foto als PNG-Data-URL; `null` bei ungültigem Namen oder fehlender Datei (wirft nie). */
export async function readPhotoDataUrl(userData: string, fileName: string): Promise<string | null> {
  let safeName: string;
  try {
    safeName = assertSafePhotoName(fileName);
  } catch {
    return null;
  }
  try {
    const png = await readFile(path.join(photoDirectory(userData), safeName));
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

/** Löscht ein gespeichertes Foto; ungültige Namen werfen, eine bereits fehlende Datei ist kein Fehler. */
export async function removePhotoFile(userData: string, fileName: string): Promise<void> {
  const safeName = assertSafePhotoName(fileName);
  await rm(path.join(photoDirectory(userData), safeName), { force: true });
}

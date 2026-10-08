// Pfade und Grenzwerte für die Datenablage im userData-Ordner sowie Sicherheitsprüfungen
// für Foto-Dateinamen und Import-Endungen (Schutz vor Path-Traversal).
import path from 'node:path';
import { CvValidationError } from '../../shared/cv/cv-migrate';

/** Erlaubtes Format gespeicherter Fotos: `<UUID>.png` – nichts anderes wird gelesen oder gelöscht. */
const PHOTO_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/i;
/** Dateiendungen, die beim Foto-Import akzeptiert werden. */
const IMPORT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
/** Maximale Größe einer zu importierenden Bilddatei (15 MB). */
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
/** Maximale Kantenlänge in Pixeln; größere Fotos werden beim Import verkleinert. */
export const MAX_PHOTO_EDGE = 800;

/** Pfad zur Lebenslaufdatei `cv-data.json` im userData-Ordner. */
export function cvFilePath(userData: string): string {
  return path.join(userData, 'cv-data.json');
}

/** Ordner `photos` im userData-Ordner, in dem die importierten Fotos als PNG liegen. */
export function photoDirectory(userData: string): string {
  return path.join(userData, 'photos');
}

/**
 * Lässt nur reine Dateinamen im Format `<UUID>.png` durch (keine Ordneranteile wie `../`)
 * und gibt den Namen unverändert zurück; sonst `CvValidationError`.
 */
export function assertSafePhotoName(fileName: string): string {
  if (!PHOTO_NAME.test(fileName) || fileName !== path.basename(fileName)) {
    throw new CvValidationError('Ungültiger Dateiname für das Foto.');
  }
  return fileName;
}

/** Wirft `CvValidationError`, wenn die zu importierende Datei nicht auf JPG, PNG oder WebP endet. */
export function assertImportExtension(filePath: string): void {
  const extension = path.extname(filePath).toLowerCase();
  if (!IMPORT_EXTENSIONS.has(extension)) {
    throw new CvValidationError('Erlaubt sind JPG, PNG und WebP.');
  }
}

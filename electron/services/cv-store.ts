// Dateiablage für mehrere Lebensläufe im userData-Ordner: library.json (Verzeichnis), cv-data.json (erster
// Lebenslauf, wie in früheren Versionen) und cvs/<id>.json für weitere. Fotos liegen gemeinsam im Ordner photos.
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CV_ID, isCvId, type CvDocumentStore } from '../../shared/cv/cv-library';
import { CvValidationError } from '../../shared/cv/cv-migrate';
import { writeAtomic } from './atomic-file';
import { assertSafePhotoName, cvFilePath, photoDirectory } from './photo-path';

/** `true`, wenn ein Dateisystemfehler „Datei existiert nicht“ (ENOENT) bedeutet. */
function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

/** Liest eine JSON-Datei ungeprüft; fehlt sie, kommt `null`. Kaputtes JSON wirft `CvValidationError`. */
export async function readJsonFile(filePath: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    if (isMissingFile(error)) {
      return null;
    }
    throw error;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new CvValidationError(`Die Datei ${path.basename(filePath)} ist kein gültiges JSON.`);
  }
}

/** Pfad der Datei eines Lebenslaufs; die Kennung wird streng geprüft, damit kein Pfad eingeschleust werden kann. */
export function cvDocumentPath(userData: string, id: string): string {
  if (!isCvId(id)) {
    throw new CvValidationError('Ungültige Kennung des Lebenslaufs.');
  }
  return id === DEFAULT_CV_ID ? cvFilePath(userData) : path.join(userData, 'cvs', `${id}.json`);
}

/** Dateibasierter `CvDocumentStore` für den Electron-Hauptprozess. */
export function createFileStore(userData: string): CvDocumentStore {
  const libraryPath = path.join(userData, 'library.json');
  return {
    readLibrary: () => readJsonFile(libraryPath),
    writeLibrary: (library) => writeAtomic(libraryPath, `${JSON.stringify(library, null, 2)}\n`),
    readCv: (id) => readJsonFile(cvDocumentPath(userData, id)),
    writeCv: (id, data) => writeAtomic(cvDocumentPath(userData, id), `${JSON.stringify(data, null, 2)}\n`),
    deleteCv: async (id) => {
      await rm(cvDocumentPath(userData, id), { force: true });
    },
    copyPhoto: async (fileName) => {
      const directory = photoDirectory(userData);
      const copy = `${randomUUID()}.png`;
      try {
        await mkdir(directory, { recursive: true });
        await copyFile(path.join(directory, assertSafePhotoName(fileName)), path.join(directory, copy));
        return copy;
      } catch {
        return null;
      }
    },
    removePhoto: async (fileName) => {
      await rm(path.join(photoDirectory(userData), assertSafePhotoName(fileName)), { force: true });
    },
  };
}

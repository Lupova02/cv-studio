// Dateidienst für die Lebenslaufdaten: liest und schreibt userData/cv-data.json
// und schickt die Daten dabei immer durch Validierung/Migration auf das aktuelle Schema.
import { readFile } from 'node:fs/promises';
import { CvValidationError, migrate } from '../../shared/cv/cv-migrate';
import { emptyCv, type CvData } from '../../shared/cv/cv-data';
import { writeAtomic } from './atomic-file';

/** `true`, wenn ein Dateisystemfehler „Datei existiert nicht“ (ENOENT) bedeutet. */
function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

/**
 * Liest cv-data.json und migriert sie auf das aktuelle Datenformat.
 * Fehlt die Datei (erster Start), kommt ein leerer Lebenslauf; kaputtes JSON wirft `CvValidationError`.
 */
export async function readCvFile(filePath: string): Promise<CvData> {
  let text: string;
  try {
    text = await readFile(filePath, 'utf8');
  } catch (error) {
    if (isMissingFile(error)) {
      return emptyCv();
    }
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new CvValidationError('Die Datei cv-data.json ist kein gültiges JSON.');
  }
  return migrate(parsed);
}

/**
 * Validiert ungeprüfte Daten aus dem Renderer per `migrate` und schreibt sie formatiert
 * und atomar nach cv-data.json. Ungültige Daten werfen, bevor etwas geschrieben wird.
 */
export async function writeCvFile(filePath: string, data: unknown): Promise<void> {
  const migrated = migrate(data);
  await writeAtomic(filePath, `${JSON.stringify(migrated, null, 2)}\n`);
}

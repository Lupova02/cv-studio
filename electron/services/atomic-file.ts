// Dateidienst des Hauptprozesses: atomares Schreiben von Textdateien (cv-data.json, Sicherungen),
// damit bei Absturz oder Stromausfall nie eine halb geschriebene Datei zurückbleibt.
import { randomBytes } from 'node:crypto';
import { mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Schreibt `contents` (UTF-8) atomar nach `targetPath`: erst in eine zufällig benannte Temp-Datei
 * im selben Ordner, auf die Platte synchronisieren, dann per `rename` ersetzen. Legt fehlende Ordner an;
 * bei Fehlern wird die Temp-Datei entfernt und die alte Zieldatei bleibt unverändert.
 */
export async function writeAtomic(targetPath: string, contents: string): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true });
  // Zufallssuffix verhindert Kollisionen bei parallelen Schreibvorgängen auf dieselbe Datei.
  const temporaryPath = `${targetPath}.${randomBytes(8).toString('hex')}.tmp`;
  const handle = await open(temporaryPath, 'w');
  try {
    await handle.writeFile(contents, 'utf8');
    // fsync vor dem Umbenennen: sonst könnte nach einem Absturz eine leere Datei unter dem Zielnamen liegen.
    await handle.sync();
  } catch (error) {
    await handle.close().catch(() => undefined);
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
  await handle.close();
  try {
    // rename innerhalb desselben Dateisystems ist atomar: Leser sehen entweder die alte oder die neue Datei.
    await rename(temporaryPath, targetPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

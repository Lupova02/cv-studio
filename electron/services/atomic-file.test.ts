import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { writeAtomic } from './atomic-file';

describe('writeAtomic', () => {
  it('ersetzt die Zieldatei und lässt keine Temp-Datei zurück', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'cv-atomic-'));
    const target = path.join(directory, 'cv-data.json');
    await writeAtomic(target, 'eins');
    await writeAtomic(target, 'zwei');
    assert.equal(await readFile(target, 'utf8'), 'zwei');
    const entries = await readdir(directory);
    assert.deepEqual(entries, ['cv-data.json']);
  });
});

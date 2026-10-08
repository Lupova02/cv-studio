import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { sampleCv } from '../../shared/cv/sample-cv';
import { readCvFile, writeCvFile } from './cv-file';

describe('cv-file', () => {
  it('legt fehlende Dateien als leeren Lebenslauf aus und schreibt atomar zurück', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'cv-file-'));
    const target = path.join(directory, 'nested', 'cv-data.json');
    const created = await readCvFile(target);
    assert.equal(created.personal.firstName, '');
    await writeCvFile(target, sampleCv());
    const loaded = await readCvFile(target);
    assert.equal(loaded.personal.lastName, 'Kaya');
    assert.equal(loaded.schemaVersion, 1);
  });

  it('behält ungültiges JSON und neuere Schemas unverändert', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'cv-file-'));
    const target = path.join(directory, 'cv-data.json');
    await writeFile(target, '{', 'utf8');
    await assert.rejects(() => readCvFile(target));
    assert.equal(await readFile(target, 'utf8'), '{');

    await writeCvFile(target, sampleCv());
    await assert.rejects(() => writeCvFile(target, { schemaVersion: 99, personal: { firstName: 'Neu' } }));
    const still = await readCvFile(target);
    assert.equal(still.personal.lastName, 'Kaya');
  });
});

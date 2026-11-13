import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { CvLibraryService, DEFAULT_CV_ID } from '../../shared/cv/cv-library';
import { sampleCv } from '../../shared/cv/sample-cv';
import { createFileStore, cvDocumentPath } from './cv-store';

const PHOTO = '0f8fad5b-d9cb-469f-a165-70867728950e.png';

describe('cv-store', () => {
  it('behält cv-data.json früherer Versionen als ersten Lebenslauf und legt weitere unter cvs/ ab', async () => {
    const userData = await mkdtemp(path.join(tmpdir(), 'cv-store-'));
    await writeFile(path.join(userData, 'cv-data.json'), JSON.stringify(sampleCv()), 'utf8');
    const service = new CvLibraryService(createFileStore(userData), () => 'de');
    assert.equal((await service.load()).personal.lastName, 'Kaya');
    const created = await service.create('Zweiter', null);
    await service.save({ ...sampleCv(), summary: 'Zweiter Text' });
    const stored = JSON.parse(await readFile(path.join(userData, 'cvs', `${created.activeId}.json`), 'utf8')) as { summary: string };
    assert.equal(stored.summary, 'Zweiter Text');
    const original = JSON.parse(await readFile(path.join(userData, 'cv-data.json'), 'utf8')) as { summary: string };
    assert.equal(original.summary, sampleCv().summary);
    const library = JSON.parse(await readFile(path.join(userData, 'library.json'), 'utf8')) as { entries: unknown[] };
    assert.equal(library.entries.length, 2);
  });

  it('lässt ungültiges JSON und abgelehnte Daten neuerer Versionen unverändert liegen', async () => {
    const userData = await mkdtemp(path.join(tmpdir(), 'cv-store-'));
    const target = path.join(userData, 'cv-data.json');
    await writeFile(target, '{', 'utf8');
    const service = new CvLibraryService(createFileStore(userData), () => 'de');
    await assert.rejects(() => service.load());
    assert.equal(await readFile(target, 'utf8'), '{');

    await writeFile(target, JSON.stringify(sampleCv()), 'utf8');
    await assert.rejects(() => service.save({ schemaVersion: 99, personal: { firstName: 'Neu' } }));
    assert.equal((await service.load()).personal.lastName, 'Kaya');
  });

  it('kopiert Fotos beim Duplizieren und lehnt fremde Pfade ab', async () => {
    const userData = await mkdtemp(path.join(tmpdir(), 'cv-store-'));
    await mkdir(path.join(userData, 'photos'));
    await writeFile(path.join(userData, 'photos', PHOTO), 'png');
    const store = createFileStore(userData);
    const copy = await store.copyPhoto(PHOTO);
    assert.ok(copy && copy !== PHOTO);
    assert.equal(await readFile(path.join(userData, 'photos', copy), 'utf8'), 'png');
    assert.equal(await store.copyPhoto('../cv-data.json'), null);
    assert.throws(() => cvDocumentPath(userData, '../library'));
    assert.equal(cvDocumentPath(userData, DEFAULT_CV_ID), path.join(userData, 'cv-data.json'));
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyCv, type CvData } from './cv-data';
import { CvLibraryService, DEFAULT_CV_ID, MAX_CV_NAME, cleanCvName, parseLibrary, uniqueCvName, type CvDocumentStore, type CvLibrary } from './cv-library';
import { sampleCv } from './sample-cv';

const PHOTO = '0f8fad5b-d9cb-469f-a165-70867728950e.png';

/** Speicher im Arbeitsspeicher, der Fotos als Menge von Dateinamen führt. */
function memoryStore(initial?: unknown) {
  const docs = new Map<string, unknown>();
  const photos = new Set<string>();
  let library: unknown = null;
  if (initial !== undefined) {
    docs.set(DEFAULT_CV_ID, initial);
  }
  let counter = 0;
  const store: CvDocumentStore = {
    readLibrary: () => Promise.resolve(structuredClone(library)),
    writeLibrary: (next) => {
      library = structuredClone(next);
      return Promise.resolve();
    },
    readCv: (id) => Promise.resolve(structuredClone(docs.get(id) ?? null)),
    writeCv: (id, data) => {
      docs.set(id, structuredClone(data));
      return Promise.resolve();
    },
    deleteCv: (id) => {
      docs.delete(id);
      return Promise.resolve();
    },
    copyPhoto: (name) => {
      if (!photos.has(name)) {
        return Promise.resolve(null);
      }
      counter++;
      const copy = `0f8fad5b-d9cb-469f-a165-${String(counter).padStart(12, '0')}.png`;
      photos.add(copy);
      return Promise.resolve(copy);
    },
    removePhoto: (name) => {
      photos.delete(name);
      return Promise.resolve();
    },
  };
  return { store, docs, photos, library: () => library as CvLibrary };
}

function withPhoto(data: CvData): CvData {
  return { ...data, personal: { ...data.personal, photoFile: PHOTO } };
}

describe('Lebenslauf-Verwaltung', () => {
  it('übernimmt beim ersten Start den vorhandenen Lebenslauf mit dem Namen der Person', async () => {
    const { store } = memoryStore(sampleCv());
    const service = new CvLibraryService(store, () => 'de');
    const library = await service.library();
    assert.equal(library.activeId, DEFAULT_CV_ID);
    assert.equal(library.entries.length, 1);
    const sample = sampleCv().personal;
    assert.equal(library.entries[0]?.name, `${sample.firstName} ${sample.lastName}`);
    assert.equal((await service.load()).personal.lastName, sample.lastName);
  });

  it('nennt einen leeren ersten Lebenslauf in der Sprache der Oberfläche', async () => {
    const service = new CvLibraryService(memoryStore().store, () => 'en');
    assert.equal((await service.library()).entries[0]?.name, 'My CV');
  });

  it('legt neue Lebensläufe an, macht sie aktiv und speichert in den aktiven', async () => {
    const { store, docs } = memoryStore(sampleCv());
    const service = new CvLibraryService(store, () => 'de');
    const created = await service.create('Bewerbung Firma X', { ...emptyCv(), summary: 'Hallo' });
    assert.notEqual(created.activeId, DEFAULT_CV_ID);
    assert.equal((await service.load()).summary, 'Hallo');
    await service.save({ ...emptyCv(), summary: 'Neu' });
    assert.equal((docs.get(created.activeId) as CvData).summary, 'Neu');
    // Der erste Lebenslauf bleibt unverändert.
    assert.equal((docs.get(DEFAULT_CV_ID) as CvData).summary, sampleCv().summary);
    const back = await service.switchTo(DEFAULT_CV_ID);
    assert.equal(back.summary, sampleCv().summary);
    assert.equal((await service.library()).activeId, DEFAULT_CV_ID);
  });

  it('übernimmt kein fremdes Foto in einen neuen Lebenslauf', async () => {
    const service = new CvLibraryService(memoryStore().store, () => 'de');
    await service.create('Neu', withPhoto(emptyCv()));
    assert.equal((await service.load()).personal.photoFile, '');
  });

  it('dupliziert samt eigener Fotokopie, sodass Löschen das Original nicht beschädigt', async () => {
    const { store, photos } = memoryStore(withPhoto(sampleCv()));
    photos.add(PHOTO);
    const service = new CvLibraryService(store, () => 'de');
    const copy = await service.duplicate(DEFAULT_CV_ID, 'Kopie');
    const duplicated = await service.load();
    assert.notEqual(duplicated.personal.photoFile, PHOTO);
    assert.ok(photos.has(duplicated.personal.photoFile));
    await service.remove(copy.activeId);
    assert.ok(photos.has(PHOTO));
    assert.ok(!photos.has(duplicated.personal.photoFile));
    assert.equal((await service.library()).activeId, DEFAULT_CV_ID);
  });

  it('macht Namen eindeutig und bereinigt sie', async () => {
    const service = new CvLibraryService(memoryStore().store, () => 'de');
    await service.create('  Bewerbung   A ', null);
    const second = await service.create('bewerbung a', null);
    assert.deepEqual(
      second.entries.map((entry) => entry.name),
      ['Mein Lebenslauf', 'Bewerbung A', 'bewerbung a (2)'],
    );
    const renamed = await service.rename(DEFAULT_CV_ID, '');
    assert.equal(renamed.entries[0]?.name, 'Mein Lebenslauf');
    assert.equal(cleanCvName('x'.repeat(200), 'y').length, MAX_CV_NAME);
  });

  it('löscht nie den letzten Lebenslauf und lehnt unbekannte Kennungen ab', async () => {
    const service = new CvLibraryService(memoryStore().store, () => 'de');
    await assert.rejects(service.remove(DEFAULT_CV_ID), /letzte/);
    await assert.rejects(service.switchTo('../../etc/passwd'), /existiert nicht/);
  });

  it('wählt nach dem Löschen des aktiven Lebenslaufs den benachbarten', async () => {
    const service = new CvLibraryService(memoryStore().store, () => 'de');
    const a = await service.create('A', null);
    const aId = a.activeId;
    await service.create('B', null);
    await service.switchTo(aId);
    const after = await service.remove(aId);
    assert.equal(after.entries.find((entry) => entry.id === after.activeId)?.name, 'B');
  });

  it('setzt beim Zurücksetzen alles auf einen leeren Lebenslauf mit dem bisherigen Design', async () => {
    const { store, photos, docs } = memoryStore(withPhoto(sampleCv()));
    photos.add(PHOTO);
    const service = new CvLibraryService(store, () => 'de');
    await service.create('B', sampleCv());
    const template = { ...emptyCv().template, templateId: 'modern' as const, language: 'en' as const };
    const library = await service.reset(template);
    assert.equal(library.entries.length, 1);
    assert.equal(photos.size, 0);
    assert.equal(docs.size, 1);
    const data = await service.load();
    assert.equal(data.personal.lastName, '');
    assert.equal(data.template.templateId, 'modern');
  });

  it('führt gleichzeitige Aufrufe nacheinander aus, ohne Änderungen zu verlieren', async () => {
    const { store, library } = memoryStore();
    const service = new CvLibraryService(store, () => 'de');
    await service.library();
    await Promise.all([service.save(emptyCv()), service.rename(DEFAULT_CV_ID, 'Umbenannt'), service.save(emptyCv())]);
    assert.equal(library().entries[0]?.name, 'Umbenannt');
  });

  it('verwirft kaputte Verzeichnisse und Einträge', () => {
    assert.equal(parseLibrary(null, 'x'), null);
    assert.equal(parseLibrary({ entries: 'nein' }, 'x'), null);
    const parsed = parseLibrary(
      {
        activeId: 'fehlt',
        entries: [{ id: '../evil', name: 'Böse' }, { id: DEFAULT_CV_ID, name: 'A', updatedAt: 'kaputt' }, { id: DEFAULT_CV_ID, name: 'Doppelt' }],
      },
      'x',
    );
    assert.equal(parsed?.entries.length, 1);
    assert.equal(parsed?.activeId, DEFAULT_CV_ID);
    assert.equal(uniqueCvName({ activeId: 'a', entries: [{ id: 'a', name: 'A', updatedAt: '' }] }, 'a'), 'a (2)');
  });
});

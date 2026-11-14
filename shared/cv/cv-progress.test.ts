import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyCv } from './cv-data';
import { sectionProgress } from './cv-progress';
import { sampleCv } from './sample-cv';

describe('Ausfüllstand der Abschnitte', () => {
  it('ist beim leeren Lebenslauf überall leer', () => {
    assert.ok(Object.values(sectionProgress(emptyCv())).every((state) => state === 'empty'));
  });

  it('unterscheidet angefangen und fertig', () => {
    const data = emptyCv();
    data.personal.firstName = 'Ada';
    data.personal.lastName = 'Lovelace';
    data.languages = [{ id: 'en', level: 'C1' }, { id: 'fr', level: '' }];
    data.summary = 'Kurz.';
    const progress = sectionProgress(data);
    assert.equal(progress.personal, 'partial');
    assert.equal(progress.languages, 'partial');
    assert.equal(progress.summary, 'done');
    assert.equal(progress.experience, 'empty');
  });

  it('meldet beim Muster die gefüllten Abschnitte als fertig', () => {
    const progress = sectionProgress(sampleCv());
    for (const section of ['personal', 'summary', 'experience', 'education', 'skills'] as const) {
      assert.equal(progress[section], 'done', section);
    }
  });
});

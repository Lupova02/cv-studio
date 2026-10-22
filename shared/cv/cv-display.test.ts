import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyCv, type CvData, type ExperienceItem } from './cv-data';
import { prepareForDisplay } from './cv-display';
import { sampleCv } from './sample-cv';

const manual = { showGender: true, entryOrder: 'manual' } as const;
const newest = { showGender: true, entryOrder: 'newest' } as const;

function job(id: string, from: string, until: string, current = false): ExperienceItem {
  return { id, company: '', position: id, country: '', city: '', from, until, current, description: '', bullets: [] };
}

describe('prepareForDisplay', () => {
  it('lässt die Reihenfolge bei „Eigene“ unverändert und verändert die Eingabe nie', () => {
    const data = sampleCv();
    data.experience.reverse();
    const before = structuredClone(data);
    const shown = prepareForDisplay(data, manual);
    assert.deepEqual(shown.experience, data.experience);
    prepareForDisplay(data, newest);
    assert.deepEqual(data, before);
  });

  it('sortiert neueste Einträge nach oben; laufende zuerst, undatierte zuletzt', () => {
    const data: CvData = {
      ...emptyCv(),
      experience: [job('ohne', '', ''), job('alt', '2015-01', '2016-06'), job('laufend', '2018-01', '', true), job('neu', '2020-03', '2023-01')],
    };
    const order = prepareForDisplay(data, newest).experience.map((item) => item.id);
    assert.deepEqual(order, ['laufend', 'neu', 'alt', 'ohne']);
  });

  it('sortiert bei gleichem Ende nach Beginn und behält sonst die Editor-Reihenfolge', () => {
    const data: CvData = {
      ...emptyCv(),
      experience: [job('kurz', '2022-01', '2023-01'), job('lang', '2019-01', '2023-01'), job('a', '', '2010-01'), job('b', '', '2010-01')],
    };
    assert.deepEqual(
      prepareForDisplay(data, newest).experience.map((item) => item.id),
      ['kurz', 'lang', 'a', 'b'],
    );
  });

  it('sortiert auch Ausbildung, Zertifikate und Projekte', () => {
    const data = sampleCv();
    data.education.reverse();
    data.certificates.reverse();
    data.projects.reverse();
    const shown = prepareForDisplay(data, newest);
    assert.deepEqual(shown.education.map((item) => item.id), ['edu-master', 'edu-bachelor', 'edu-school']);
    assert.deepEqual(shown.certificates.map((item) => item.id), ['cert-aws', 'cert-psm', 'cert-istqb']);
    assert.deepEqual(shown.projects.map((item) => item.id), ['proj-tidewatch', 'proj-verein']);
  });

  it('blendet das Geschlecht aus, wenn es nicht angezeigt werden soll', () => {
    const data = sampleCv();
    assert.equal(prepareForDisplay(data, manual).personal.gender, 'male');
    assert.equal(prepareForDisplay(data, { ...manual, showGender: false }).personal.gender, '');
    assert.equal(data.personal.gender, 'male');
  });

  it('entfernt leere Referenzen und „Über mich“ aus reinen Leerzeichen', () => {
    const data: CvData = {
      ...emptyCv(),
      summary: '   ',
      references: [
        { id: 'leer', name: ' ', position: '', company: '', email: '', phone: '' },
        { id: 'voll', name: '', position: '', company: 'Firma', email: '', phone: '' },
      ],
    };
    const shown = prepareForDisplay(data, manual);
    assert.equal(shown.summary, '');
    assert.deepEqual(shown.references.map((item) => item.id), ['voll']);
  });
});

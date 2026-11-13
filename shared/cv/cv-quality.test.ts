import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyCv, type CvData } from './cv-data';
import { QUALITY_LIMITS, checkCv } from './cv-quality';
import { sampleCv } from './sample-cv';

const TODAY = new Date(2026, 10, 13);

function ids(data: CvData, pages?: number): string[] {
  return checkCv(data, { today: TODAY, pages, photoShown: true }).map((hint) => hint.id);
}

describe('Qualitätscheck', () => {
  it('meldet bei einem leeren Lebenslauf die wichtigsten fehlenden Angaben, Warnungen zuerst', () => {
    const hints = checkCv(emptyCv(), { today: TODAY, photoShown: true });
    const found = hints.map((hint) => hint.id);
    for (const id of ['name', 'email', 'phone', 'photo', 'summary', 'experience', 'education', 'skills', 'languages']) {
      assert.ok(found.includes(id), `${id} fehlt`);
    }
    const firstInfo = hints.findIndex((hint) => hint.level === 'info');
    assert.ok(hints.slice(firstInfo).every((hint) => hint.level === 'info'));
  });

  it('hat am Muster-Lebenslauf keine Warnungen', () => {
    const data = sampleCv();
    const warnings = checkCv({ ...data, personal: { ...data.personal, photoFile: '' } }, { today: TODAY }).filter((hint) => hint.level === 'warning');
    assert.deepEqual(warnings, []);
  });

  it('erkennt unstimmige Zeiträume, Zukunft, fehlende Titel und lange Texte', () => {
    const data = emptyCv();
    data.experience = [
      {
        id: 'a',
        company: '',
        position: '',
        country: '',
        city: '',
        from: '2027-01',
        until: '2026-01',
        current: false,
        description: 'x'.repeat(QUALITY_LIMITS.description + 1),
        bullets: ['', 'y'.repeat(QUALITY_LIMITS.bullet + 1)],
      },
    ];
    data.summary = 'z'.repeat(QUALITY_LIMITS.summary + 1);
    const found = ids(data);
    for (const id of ['experience-0-title', 'experience-0-order', 'experience-0-future', 'experience-0-long', 'experience-0-bullet-0-empty', 'experience-0-bullet-1-long', 'summary-long']) {
      assert.ok(found.includes(id), `${id} fehlt`);
    }
  });

  it('wertet „bis heute“ nicht als falsche Reihenfolge und prüft E-Mail-Adressen', () => {
    const data = sampleCv();
    data.experience = [{ ...data.experience[0]!, from: '2020-01', until: '2019-01', current: true }];
    data.personal.email = 'kein-at-zeichen';
    const found = ids(data);
    assert.ok(!found.includes('experience-0-order'));
    assert.ok(found.includes('email-invalid'));
  });

  it('formuliert Hinweise in der Lebenslauf-Sprache und meldet zu viele Seiten', () => {
    const data = { ...emptyCv(), template: { ...emptyCv().template, language: 'en' as const } };
    data.languages = [{ id: 'fr', level: '' }];
    const hints = checkCv(data, { today: TODAY, pages: 3 });
    assert.equal(hints.find((hint) => hint.id === 'pages')?.text, 'The CV has 3 pages – 1–2 are common.');
    assert.match(hints.find((hint) => hint.id === 'language-fr')?.text ?? '', /^French: level is missing\.$/);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LIMITS, emptyCv } from './cv-data';
import { migrate } from './cv-migrate';
import { countTranslatable, translateCv } from './cv-translate';
import { sampleCv } from './sample-cv';

const upper = async (texts: string[]) => texts.map((text) => text.toUpperCase());

describe('translateCv', () => {
  it('übersetzt nur eigene Texte und lässt Namen, Orte und Einstellungen unverändert', async () => {
    const data = sampleCv();
    const result = await translateCv(data, upper);
    const job = data.experience[0];
    const translated = result.experience[0];
    assert.equal(translated.position, job.position.toUpperCase());
    assert.equal(translated.description, job.description.toUpperCase());
    assert.deepEqual(translated.bullets, job.bullets.map((bullet) => bullet.toUpperCase()));
    assert.equal(translated.company, job.company);
    assert.equal(translated.city, job.city);
    assert.equal(result.education[0].institution, data.education[0].institution);
    assert.equal(result.education[0].degree, data.education[0].degree.toUpperCase());
    assert.equal(result.projects[0]?.name, data.projects[0]?.name);
    assert.equal(result.summary, data.summary.toUpperCase());
    assert.equal(result.references[0]?.position, data.references[0]?.position.toUpperCase());
    assert.equal(result.references[0]?.name, data.references[0]?.name);
    assert.equal(result.references[0]?.company, data.references[0]?.company);
    assert.deepEqual(result.personal, data.personal);
    assert.deepEqual(result.skills, data.skills);
    assert.deepEqual(result.template, data.template);
    assert.notEqual(result, data);
    assert.equal(data.experience[0].position, job.position);
  });

  it('übersetzt gleiche Texte nur einmal und überspringt leere Felder', async () => {
    const data = emptyCv();
    data.experience = [
      { ...sampleCv().experience[0], position: 'Entwicklerin', description: '', bullets: ['Tests', '  ', 'Tests'] },
    ];
    const seen: string[][] = [];
    const result = await translateCv(data, async (texts) => {
      seen.push(texts);
      return texts.map((text) => `${text}!`);
    });
    assert.deepEqual(seen, [['Entwicklerin', 'Tests']]);
    assert.deepEqual(result.experience[0].bullets, ['Tests!', '  ', 'Tests!']);
    assert.equal(result.experience[0].description, '');
    assert.equal(countTranslatable(data), 3);
  });

  it('kürzt zu lange Übersetzungen auf die erlaubte Länge', async () => {
    const data = emptyCv();
    data.experience = [{ ...sampleCv().experience[0], position: 'Kurz', bullets: [] }];
    const result = await translateCv(data, async (texts) => texts.map(() => 'x'.repeat(500)));
    assert.equal(result.experience[0].position.length, LIMITS.shortText);
    assert.doesNotThrow(() => migrate(result));
  });

  it('behält den Originaltext, wenn die Übersetzung leer ist', async () => {
    const data = sampleCv();
    const result = await translateCv(data, async (texts) => texts.map(() => ''));
    assert.deepEqual(result, data);
  });
});

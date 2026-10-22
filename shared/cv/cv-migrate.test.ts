import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SCHEMA_VERSION, emptyCv } from './cv-data';
import { CvValidationError, migrate } from './cv-migrate';
import { sampleCv } from './sample-cv';

describe('migrate', () => {
  it('erzeugt aus leeren Eingaben einen gültigen Lebenslauf', () => {
    assert.deepEqual(migrate(null), emptyCv());
    assert.equal(migrate({}).schemaVersion, SCHEMA_VERSION);
    assert.equal(migrate({}).template.templateId, 'classic');
  });

  it('übernimmt bekannte Felder und verwirft Unbekanntes', () => {
    const result = migrate({
      schemaVersion: 1,
      personal: { firstName: 'Ada', unknown: 'weg' },
      summary: ' Kurz ',
      extra: true,
    });
    assert.equal(result.personal.firstName, 'Ada');
    assert.equal(result.summary, 'Kurz');
    assert.equal('unknown' in result.personal, false);
    assert.equal('extra' in result, false);
    assert.equal('interests' in migrate({ interests: [{ label: 'Typografie' }] }), false);
  });

  it('vergibt fehlende Listen-IDs und behält gültige', () => {
    const result = migrate({
      experience: [{ id: 'job-1', company: 'A', position: 'B', current: true }],
    });
    assert.equal(result.experience[0]?.id, 'job-1');
    assert.equal(result.experience[0]?.current, true);
    const generated = migrate({ certificates: [{ name: 'ISTQB' }] });
    assert.match(generated.certificates[0]?.id ?? '', /^[0-9a-f-]{36}$/i);
    assert.deepEqual(migrate({ skills: [{ name: 'TypeScript', level: 'sicher' }] }).skills, [{ id: 'typescript', stars: 4 }]);
    assert.deepEqual(migrate({ skills: [{ name: 'Node.js', level: 'gut' }] }).skills, [{ id: 'nodejs', stars: 3 }]);
    assert.deepEqual(migrate({ skills: [{ name: 'Unbekannte Kenntnis' }] }).skills, []);
    assert.deepEqual(
      migrate({
        languages: [
          { language: 'Türkisch', level: 'Grundkenntnisse' },
          { language: 'Deutsch', level: 'Muttersprache' },
          { language: 'Unbekannt', level: 'gut' },
        ],
      }).languages,
      [
        { id: 'de', level: 'native' },
        { id: 'tr', level: 'a2' },
      ],
    );
  });

  it('lehnt eine neuere Schemaversion ab', () => {
    assert.throws(() => migrate({ schemaVersion: 99, personal: { firstName: 'Neu' } }), CvValidationError);
  });

  it('lehnt zu lange Listen und falsche Typen ab', () => {
    assert.throws(() => migrate({ experience: Array.from({ length: 51 }, () => ({})) }), CvValidationError);
    assert.throws(() => migrate({ summary: 12 }), CvValidationError);
    assert.throws(() => migrate({ references: [{ name: 'x'.repeat(121) }] }), CvValidationError);
    assert.throws(() => migrate({ skills: 'TypeScript' }), CvValidationError);
  });

  it('normalisiert ungültige Daten und Fotodateien', () => {
    const result = migrate({
      personal: { birthDate: '1990-02-31', photoFile: '../geheim.png' },
      experience: [{ from: 'März 2020', until: '2020-13' }],
      template: { templateId: 'fremd', accentColor: 'blau', language: 'fr' },
    });
    assert.equal(result.personal.birthDate, '');
    assert.equal(result.personal.photoFile, '');
    assert.equal(result.experience[0]?.from, '');
    assert.equal(result.experience[0]?.until, '');
    assert.equal(result.template.templateId, 'classic');
    assert.equal(result.template.accentColor, '#1f4b99');
    assert.equal(result.template.language, 'de');
    assert.equal(result.template.skillScale, 'stars');
    assert.equal(result.template.datePlace, 'aside');
    assert.equal(result.template.timeline, 'line');
    assert.equal(result.template.font, 'sourceSans');
    assert.equal(migrate({ template: { skillScale: 'bars' } }).template.skillScale, 'bars');
    assert.equal(migrate({ template: { skillScale: 'off' } }).template.skillScale, 'off');
    assert.equal(result.template.showGender, true);
    assert.equal(migrate({ template: { showGender: false } }).template.showGender, false);
    assert.equal(result.template.entryOrder, 'manual');
    assert.equal(migrate({ template: { entryOrder: 'newest' } }).template.entryOrder, 'newest');
    assert.equal(migrate({ template: { entryOrder: 'oldest' } }).template.entryOrder, 'manual');
    assert.equal(migrate({ template: { datePlace: 'below' } }).template.datePlace, 'below');
    assert.equal(migrate({ template: { timeline: 'off' } }).template.timeline, 'off');
    assert.equal(migrate({ template: { font: 'comicSans' } }).template.font, 'comicSans');
    assert.equal(migrate({ template: { font: 'papyrus' } }).template.font, 'sourceSans');
    assert.equal(result.template.pageNumbers, 'fraction');
    assert.equal(result.template.pageNumberPlace, 'right');
    assert.equal(migrate({ template: { pageNumbers: 'badge', pageNumberPlace: 'center' } }).template.pageNumbers, 'badge');
    assert.equal(migrate({ template: { pageNumbers: 'roman', pageNumberPlace: 'top' } }).template.pageNumberPlace, 'right');
    const legacyPlace = migrate({ experience: [{ location: 'Berlin, Deutschland' }] }).experience[0];
    assert.equal(legacyPlace?.city, 'Berlin');
    assert.equal(legacyPlace?.country, 'DE');
    const cityOnly = migrate({ experience: [{ location: 'Hamburg' }] }).experience[0];
    assert.equal(cityOnly?.city, 'Hamburg');
    assert.equal(cityOnly?.country, '');
    assert.equal(result.personal.gender, '');
    assert.equal('title' in result.personal, false);
  });

  it('übernimmt Türkisch, Geburtsort und Geschlecht und verwirft den alten Titel', () => {
    const result = migrate({
      personal: { title: 'Dr.', birthPlace: 'İstanbul', gender: 'female' },
      template: { language: 'tr' },
    });
    assert.equal(result.personal.birthPlace, 'İstanbul');
    assert.equal(result.personal.gender, 'female');
    assert.equal('title' in result.personal, false);
    assert.equal(result.template.language, 'tr');
    assert.equal(migrate({ personal: { gender: 'sonst' } }).personal.gender, '');
  });

  it('übernimmt alte Telefon-, Adress- und Staatsangehörigkeitsangaben', () => {
    const result = migrate({
      personal: {
        phone: '+49 151 00000000',
        address: 'Musterstraße 12, 10115 Berlin',
        nationality: 'deutsch',
      },
    });
    assert.equal(result.personal.phones[0]?.country, 'DE');
    assert.equal(result.personal.phones[0]?.dial, '+49');
    assert.equal(result.personal.phones[0]?.number, '151 00000000');
    assert.equal(result.personal.phones[0]?.id, 'legacy-phone');
    assert.equal(result.personal.address.street, 'Musterstraße 12, 10115 Berlin');
    assert.equal(result.personal.address.postalCode, '');
    assert.deepEqual(result.personal.nationalities, [{ code: 'DE', custom: '' }]);
    const custom = migrate({ personal: { nationality: 'Weltenbürger' } });
    assert.deepEqual(custom.personal.nationalities, [{ code: 'other', custom: 'Weltenbürger' }]);
  });

  it('führt Beispieldaten unverändert im Schema 1 durch', () => {
    const sample = sampleCv();
    const again = migrate(sample);
    assert.equal(again.personal.lastName, 'Kaya');
    assert.equal(again.experience.length, 4);
    assert.equal(again.projects[0]?.bullets.length, 3);
    assert.deepEqual(again, sample);
  });

  it('erkennt kleingeschriebene Ländercodes', () => {
    const result = migrate({
      personal: { nationalities: [{ code: 'de' }], phones: [{ country: 'tr', number: '1' }], address: { country: 'at' } },
    });
    assert.equal(result.personal.nationalities[0]?.code, 'DE');
    assert.equal(result.personal.phones[0]?.country, 'TR');
    assert.equal(result.personal.phones[0]?.dial, '+90');
    assert.equal(result.personal.address.country, 'AT');
  });

  it('ersetzt doppelte IDs innerhalb einer Liste', () => {
    const result = migrate({
      experience: [
        { id: 'job', company: 'A' },
        { id: 'job', company: 'B' },
      ],
      personal: { phones: [{ id: 'p', number: '1' }, { id: 'p', number: '2' }] },
    });
    assert.equal(result.experience[0]?.id, 'job');
    assert.notEqual(result.experience[1]?.id, 'job');
    assert.equal(result.experience[1]?.company, 'B');
    assert.notEqual(result.personal.phones[0]?.id, result.personal.phones[1]?.id);
  });

  it('erkennt Niveau-Wörter mit Umlaut und ß', () => {
    assert.deepEqual(migrate({ languages: [{ language: 'Englisch', level: 'fließend' }] }).languages, [{ id: 'en', level: 'c1' }]);
    assert.deepEqual(migrate({ languages: [{ language: 'Französisch', level: 'Anfänger' }] }).languages, [{ id: 'fr', level: 'a1' }]);
    assert.deepEqual(migrate({ skills: [{ name: 'Python', level: 'Anfänger' }] }).skills, [{ id: 'python', stars: 2 }]);
  });

  it('übernimmt Referenzen und ergänzt sie bei alten Ständen als leere Liste', () => {
    const result = migrate({
      references: [{ id: 'ref', name: ' Ada Muster ', position: 'Teamleitung', email: 'ada@example.com', extra: 1 }],
    });
    assert.deepEqual(result.references, [
      { id: 'ref', name: 'Ada Muster', position: 'Teamleitung', company: '', email: 'ada@example.com', phone: '' },
    ]);
    assert.deepEqual(migrate({ personal: { firstName: 'Alt' } }).references, []);
    assert.equal(migrate({ personal: { firstName: 'Alt' } }).summary, '');
  });
});

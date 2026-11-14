import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { contrastRatio, onAccentColor } from './color';
import { ACCENT_PRESETS } from '../catalogs/accent-presets';
import { suggestFileBase } from './file-name';
import { addressLine, addressLines, contactEntries, formatPageNumber, formatRange, formatYearMonth, linkEntries, nationalityLine, relativeTime } from './format';
import { emptyPersonal } from '../cv/cv-data';
import { parsePrintJob } from '../ipc/ipc-parse';
import { sampleCv } from '../cv/sample-cv';

describe('Format und Exportauftrag', () => {
  it('formatiert Zeiträume sprachabhängig', () => {
    assert.match(formatYearMonth('2020-01', 'en'), /Jan/);
    assert.match(formatYearMonth('2020-01', 'en'), /2020/);
    assert.equal(formatYearMonth('nein', 'de'), '');
    assert.match(formatRange('2020-01', '', true, 'de'), /heute/);
    assert.match(formatRange('2020-01', '', true, 'tr'), /günümüz/);
    assert.match(formatRange('2020-01', '2021-05', false, 'en'), /2021/);
  });

  it('formatiert Seitenzahlen je Stil und Sprache', () => {
    assert.equal(formatPageNumber('fraction', 1, 2, 'de'), '1/2');
    assert.equal(formatPageNumber('number', 2, 3, 'de'), '2');
    assert.equal(formatPageNumber('dashed', 1, 2, 'de'), '– 1 –');
    assert.equal(formatPageNumber('label', 1, 2, 'de'), 'Seite 1 von 2');
    assert.equal(formatPageNumber('label', 1, 2, 'en'), 'Page 1 of 2');
    assert.equal(formatPageNumber('label', 2, 2, 'tr'), 'Sayfa 2 / 2');
    assert.equal(formatPageNumber('badge', 3, 4, 'en'), '3');
    assert.equal(formatPageNumber('pill', 1, 2, 'tr'), '1 / 2');
    assert.equal(formatPageNumber('off', 1, 2, 'de'), '');
  });

  it('wählt die Schriftfarbe nach Helligkeit', () => {
    assert.equal(onAccentColor('#1f4b99'), '#ffffff');
    assert.equal(onAccentColor('#f5e27a'), '#111111');
    assert.equal(onAccentColor('blau'), '#ffffff');
    // Orange: Weiß hätte nur 2,4:1 Kontrast, Schwarz deutlich mehr.
    assert.equal(onAccentColor('#ff8c00'), '#111111');
    assert.equal(onAccentColor('#2e7d32'), '#ffffff');
  });

  it('erreicht für jede Akzentfarbe mindestens AA-Kontrast für große Schrift', () => {
    for (let value = 0; value < 0x1000000; value += 0x0f0f0f + 0x101) {
      const hex = `#${value.toString(16).padStart(6, '0')}`;
      const ratio = contrastRatio(hex, onAccentColor(hex)) ?? 0;
      assert.ok(ratio >= 3, `${hex}: ${ratio.toFixed(2)}`);
    }
  });

  it('bildet einen sicheren Dateinamen', () => {
    const data = sampleCv();
    assert.equal(suggestFileBase(data), 'Daniel-Kaya');
    data.personal.firstName = 'Mína';
    data.personal.lastName = '';
    assert.equal(suggestFileBase(data), 'Mina');
    data.personal.firstName = 'Yıldız';
    data.personal.lastName = 'Strauß';
    assert.equal(suggestFileBase(data), 'Yildiz-Strauss');
  });

  it('nennt die PDF ohne Namen in der Sprache des Lebenslaufs', () => {
    const data = sampleCv();
    data.personal.firstName = '';
    data.personal.lastName = '—';
    assert.equal(suggestFileBase({ ...data, template: { ...data.template, language: 'de' } }), 'Lebenslauf');
    assert.equal(suggestFileBase({ ...data, template: { ...data.template, language: 'en' } }), 'CV');
    assert.equal(suggestFileBase({ ...data, template: { ...data.template, language: 'tr' } }), 'Ozgecmis');
  });

  it('formatiert Staatsangehörigkeit und Adresse je Land', () => {
    const person = emptyPersonal();
    person.nationalities = [
      { code: 'DE', custom: '' },
      { code: 'other', custom: 'Kosovarisch' },
    ];
    assert.equal(nationalityLine(person, 'de'), 'Staatsangehörigkeit: Deutsch · Kosovarisch');
    person.nationalities = [
      { code: 'DE', custom: '' },
      { code: 'TR', custom: '' },
    ];
    assert.equal(nationalityLine(person, 'tr'), 'Uyruk: Alman · Türk');
    const sample = sampleCv().personal;
    assert.deepEqual(
      contactEntries(sample, 'de').map((entry) => entry.icon),
      ['email', 'mobile', 'home', 'work', 'address'],
    );
    assert.deepEqual(
      linkEntries(sample).map((entry) => entry.icon),
      ['linkedin', 'github', 'website'],
    );
    assert.deepEqual(linkEntries({ ...sample, linkedIn: '', github: ' ', website: '' }), []);
    person.address = { ...person.address, country: 'DE', street: 'Musterstraße', houseNumber: '12', postalCode: '10115', city: 'Berlin' };
    assert.equal(addressLine(person.address, 'de'), 'Musterstraße 12, 10115 Berlin, Deutschland');
    assert.deepEqual(addressLines(person.address, 'de'), ['Musterstraße 12', '10115 Berlin', 'Deutschland']);
    person.address = {
      ...person.address,
      country: 'TR',
      street: 'İstiklal',
      houseNumber: '10',
      postalCode: '34000',
      city: 'İstanbul',
      neighborhood: 'Beyoğlu',
      apartment: '4',
      district: 'Beyoğlu',
      province: 'İstanbul',
    };
    assert.equal(addressLine(person.address, 'tr'), 'Beyoğlu İstiklal 10, 4, Beyoğlu / İstanbul, Türkiye');
    assert.equal(addressLine(person.address, 'tr').includes('34000'), false);
    assert.deepEqual(addressLines(person.address, 'tr'), ['Beyoğlu İstiklal 10 4', 'Beyoğlu / İstanbul', 'Türkiye']);
  });

  it('prüft Druckaufträge streng und entfernt Foto-Daten-URLs', () => {
    const job = parsePrintJob({
      templateId: 'modern',
      options: { showPhoto: true, accentColor: '#AABBCC', language: 'en', photoDataUrl: 'data:image/png;base64,xx' },
      data: sampleCv(),
    });
    assert.equal(job.templateId, 'modern');
    assert.equal(job.options.accentColor, '#aabbcc');
    assert.equal(job.options.skillScale, 'stars');
    assert.equal(job.options.datePlace, 'aside');
    assert.equal(job.options.timeline, 'line');
    assert.equal(job.options.font, 'sourceSans');
    assert.equal(
      parsePrintJob({ templateId: 'modern', options: { showPhoto: false, accentColor: '#112233', language: 'de', font: 'lora' }, data: {} }).options.font,
      'lora',
    );
    assert.equal(
      parsePrintJob({ templateId: 'modern', options: { showPhoto: false, accentColor: '#112233', language: 'de', skillScale: 'bars' }, data: {} }).options.skillScale,
      'bars',
    );
    assert.equal(job.options.showGender, true);
    assert.equal(job.options.entryOrder, 'manual');
    const hidden = parsePrintJob({
      templateId: 'minimal',
      options: { showPhoto: false, showGender: false, accentColor: '#112233', language: 'tr', skillScale: 'off', entryOrder: 'newest' },
      data: {},
    }).options;
    assert.equal(hidden.showGender, false);
    assert.equal(hidden.skillScale, 'off');
    assert.equal(hidden.entryOrder, 'newest');
    assert.equal(job.options.pageNumbers, 'fraction');
    assert.equal(job.options.pageNumberPlace, 'right');
    const numbered = parsePrintJob({
      templateId: 'classic',
      options: { showPhoto: false, accentColor: '#112233', language: 'de', pageNumbers: 'dashed', pageNumberPlace: 'center' },
      data: {},
    }).options;
    assert.equal(numbered.pageNumbers, 'dashed');
    assert.equal(numbered.pageNumberPlace, 'center');
    assert.equal(job.options.photoDataUrl, undefined);
    assert.throws(() => parsePrintJob({ templateId: 'fremd', options: {}, data: {} }));
  });
});

describe('Relative Zeitangabe', () => {
  const now = new Date(2026, 10, 14, 15, 30);
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

  it('nennt Minuten, Stunden, gestern und Tage kurz', () => {
    assert.equal(relativeTime(ago(0), now, 'de'), 'jetzt');
    assert.equal(relativeTime(ago(5), now, 'de'), 'vor 5 Min.');
    assert.equal(relativeTime(ago(180), now, 'de'), 'vor 3 Std.');
    assert.equal(relativeTime(ago(24 * 60), now, 'de'), 'gestern');
    assert.equal(relativeTime(ago(3 * 24 * 60), now, 'de'), 'vor 3 Tagen');
    assert.equal(relativeTime(ago(5), now, 'en'), '5 min ago');
  });

  it('zeigt ab einer Woche das Datum und bleibt bei ungültigen Werten leer', () => {
    assert.equal(relativeTime(new Date(2026, 9, 1).toISOString(), now, 'de'), '01.10.2026');
    assert.equal(relativeTime('', now, 'de'), '');
    assert.equal(relativeTime(new Date(0).toISOString(), now, 'de'), '');
  });
});

describe('Akzentfarben-Vorgaben', () => {
  it('hat acht verschiedene Farben, alle mit AA-Kontrast für weiße Schrift', () => {
    assert.equal(ACCENT_PRESETS.length, 8);
    assert.equal(new Set(ACCENT_PRESETS.map((preset) => preset.color)).size, 8);
    for (const preset of ACCENT_PRESETS) {
      const ratio = contrastRatio('#ffffff', preset.color) ?? 0;
      assert.ok(ratio >= 4.5, `${preset.name.de} (${preset.color}) = ${ratio.toFixed(2)}:1`);
      assert.equal(onAccentColor(preset.color), '#ffffff');
    }
  });
});


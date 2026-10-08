import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BACKUP_FORMAT, backupFileName, createBackup, parseBackup, serializeBackup } from './backup';
import { SCHEMA_VERSION } from './cv-data';
import { migrate } from './cv-migrate';
import { sampleCv } from './sample-cv';

const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PHOTO_FILE = '0f8fad5b-d9cb-469f-a165-70867728950e.png';

function sampleWithPhoto() {
  const data = sampleCv();
  return {
    ...data,
    personal: { ...data.personal, photoFile: PHOTO_FILE },
    template: { ...data.template, templateId: 'minimal' as const, accentColor: '#aa3366', font: 'lora' as const, pageNumbers: 'pill' as const },
  };
}

describe('Sicherung', () => {
  it('übernimmt beim Export und Import alle Daten, Einstellungen und das Foto', () => {
    const data = sampleWithPhoto();
    const text = serializeBackup(createBackup(data, PHOTO, new Date('2026-10-08T10:00:00Z')));
    const raw = JSON.parse(text) as Record<string, unknown>;
    assert.equal(raw['format'], BACKUP_FORMAT);
    assert.equal(raw['exportedAt'], '2026-10-08T10:00:00.000Z');
    const parsed = parseBackup(text, 'de');
    assert.deepEqual(parsed.data, migrate(data));
    assert.equal(parsed.photoDataUrl, PHOTO);
  });

  it('bettet kein Foto ein, wenn keines gewählt ist, und verwirft ungültige Fotodaten', () => {
    const plain = createBackup(sampleCv(), PHOTO);
    assert.equal('photoDataUrl' in plain, false);
    const broken = JSON.stringify({ ...sampleWithPhoto(), photoDataUrl: 'data:text/html;base64,PHNjcmlwdD4=' });
    assert.equal(parseBackup(broken, 'de').photoDataUrl, null);
  });

  it('liest auch alte Sicherungen ohne Format-Kennung', () => {
    const legacy = JSON.stringify(sampleCv());
    const parsed = parseBackup(legacy, 'en');
    assert.deepEqual(parsed.data, migrate(sampleCv()));
    assert.equal(parsed.photoDataUrl, null);
  });

  it('meldet ungültige und zu neue Dateien in der gewählten Sprache', () => {
    assert.throws(() => parseBackup('{kaputt', 'de'), /keine gültige CV-Studio-Sicherung/);
    assert.throws(() => parseBackup('[1, 2]', 'en'), /not a valid CV-Studio backup/);
    assert.throws(() => parseBackup(JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 }), 'tr'), /daha yeni bir sürümünden/);
    const tooLong = JSON.stringify({ personal: { firstName: 'x'.repeat(500) } });
    assert.throws(() => parseBackup(tooLong, 'de'), /Vorname ist zu lang/);
    assert.throws(() => parseBackup(tooLong, 'en'), /not a valid CV-Studio backup/);
  });

  it('benennt die Datei nach Sprache und Datum', () => {
    const day = new Date(2026, 9, 8, 12);
    assert.equal(backupFileName('de', day), 'lebenslauf-sicherung-2026-10-08.json');
    assert.equal(backupFileName('en', day), 'cv-backup-2026-10-08.json');
    assert.equal(backupFileName('tr', day), 'ozgecmis-yedek-2026-10-08.json');
  });
});

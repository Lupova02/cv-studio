import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { CvValidationError } from '../../shared/cv/cv-migrate';
import { assertImportExtension, assertSafePhotoName, cvFilePath, photoDirectory } from './photo-path';

describe('Foto-Pfade', () => {
  it('erlaubt nur UUID-PNG-Dateinamen', () => {
    const name = '6f1d7c2e-8a1b-4c3d-9e5f-123456789abc.png';
    assert.equal(assertSafePhotoName(name), name);
    assert.throws(() => assertSafePhotoName('../x.png'), CvValidationError);
    assert.throws(() => assertSafePhotoName('foto.jpg'), CvValidationError);
  });

  it('prüft Import-Endungen und userData-Pfade', () => {
    assert.doesNotThrow(() => assertImportExtension('/tmp/bild.WEBP'));
    assert.throws(() => assertImportExtension('/tmp/bild.gif'), CvValidationError);
    assert.equal(path.basename(cvFilePath('/data')), 'cv-data.json');
    assert.equal(path.basename(photoDirectory('/data')), 'photos');
  });
});

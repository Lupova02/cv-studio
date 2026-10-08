import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  DEVELOPMENT_CSP,
  PRODUCTION_CSP,
  appUrl,
  devServerFromEnv,
  isNavigationAllowed,
  isPrintDocument,
} from './security';

describe('Fenster-Sicherheit', () => {
  it('erlaubt nur den lokalen Dev-Server und das App-Protokoll', () => {
    const dev = 'http://127.0.0.1:4200';
    assert.equal(isNavigationAllowed(`${dev}/`, dev), true);
    assert.equal(isNavigationAllowed('cvstudio://app/index.html', null), true);
    assert.equal(isNavigationAllowed('cvstudio://app/index.html', dev), false);
    assert.equal(isNavigationAllowed('https://example.com', dev), false);
    assert.equal(isNavigationAllowed('file:///etc/passwd', dev), false);
    assert.equal(isNavigationAllowed(`${dev}/`, null), false);
    assert.equal(isNavigationAllowed('javascript:alert(1)', dev), false);
  });

  it('ignoriert den Dev-Server in der paketierten App', () => {
    assert.equal(devServerFromEnv(true, 'http://127.0.0.1:4200'), null);
    assert.equal(devServerFromEnv(false, 'http://evil.example'), null);
    assert.equal(devServerFromEnv(false, 'http://127.0.0.1:4200/index.html'), 'http://127.0.0.1:4200');
  });

  it('unterscheidet Druckroute und CSP', () => {
    assert.equal(isPrintDocument('cvstudio://app/index.html#/print'), true);
    assert.equal(isPrintDocument('http://127.0.0.1:4200/#/'), false);
    assert.equal(appUrl(null, '/print'), 'cvstudio://app/index.html#/print');
    assert.equal(appUrl('http://127.0.0.1:4200', '/print'), 'http://127.0.0.1:4200/#/print');
    assert.equal(PRODUCTION_CSP.includes("'unsafe-eval'"), false);
    assert.equal(PRODUCTION_CSP.includes('https:'), false);
    assert.match(PRODUCTION_CSP, /connect-src 'self';/);
    assert.match(PRODUCTION_CSP, /worker-src 'self'/);
    assert.equal(DEVELOPMENT_CSP.includes('127.0.0.1'), true);
  });

  it('verwendet in der gebauten index.html dieselbe CSP wie der Hauptprozess', () => {
    const html = readFileSync(path.resolve(__dirname, '../../src/index.prod.html'), 'utf8');
    const meta = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html);
    assert.equal(meta?.[1], PRODUCTION_CSP);
  });
});

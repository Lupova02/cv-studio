import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { contrastRatio } from './color';

const root = path.resolve(__dirname, '..', '..', '..');
const styles = readFileSync(path.join(root, 'src', 'styles.scss'), 'utf8');

/** Liest die Hex-Tokens eines Blocks (`:root {` bzw. `@mixin dark-tokens {`) aus styles.scss. */
function tokens(blockStart: string): Map<string, string> {
  const start = styles.indexOf(blockStart);
  assert.ok(start >= 0, `${blockStart} fehlt`);
  const block = styles.slice(start, styles.indexOf('\n}', start));
  return new Map(Array.from(block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6});/g), (match) => [match[1] ?? '', match[2] ?? '']));
}

const light = tokens(':root {');
const dark = new Map([...light, ...tokens('@mixin dark-tokens {')]);

/** Text-/Hintergrund-Paare der Oberfläche, die WCAG AA (4,5:1) erreichen müssen. */
const TEXT_PAIRS: [string, string][] = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text-muted', 'surface'],
  ['text-muted', 'surface-2'],
  ['text-subtle', 'surface'],
  ['text-subtle', 'bg'],
  ['text-subtle', 'surface-2'],
  ['accent', 'surface'],
  ['accent', 'accent-soft'],
  ['on-accent', 'accent'],
  ['on-accent', 'accent-hover'],
  ['danger', 'surface'],
  ['danger', 'danger-soft'],
  ['on-danger', 'danger-solid'],
  ['success', 'surface'],
  ['success', 'success-soft'],
  ['warning', 'surface'],
  ['warning', 'warning-soft'],
  ['text', 'toolbar'],
  // Lebenslauf-Liste (aktiver Eintrag), Zähler-Badges, Muster-Banner.
  ['text-subtle', 'accent-soft'],
  ['text', 'surface-3'],
  ['text-muted', 'bg'],
  ['text-muted', 'toolbar'],
];

describe('Farbschema', () => {
  for (const [name, theme] of [
    ['hellen', light],
    ['dunklen', dark],
  ] as const) {
    it(`erreicht im ${name} Modus WCAG AA für alle Textpaare`, () => {
      for (const [foreground, background] of TEXT_PAIRS) {
        const fg = theme.get(foreground);
        const bg = theme.get(background);
        assert.ok(fg && bg, `Token fehlt: ${foreground}/${background}`);
        const ratio = contrastRatio(fg, bg) ?? 0;
        assert.ok(ratio >= 4.5, `${name}: ${foreground} auf ${background} = ${ratio.toFixed(2)}:1`);
      }
    });

    it(`grenzt im ${name} Modus Bedienelemente sichtbar ab (3:1)`, () => {
      for (const token of ['accent', 'danger-solid']) {
        const ratio = contrastRatio(theme.get(token) ?? '', theme.get('surface') ?? '') ?? 0;
        assert.ok(ratio >= 3, `${name}: ${token} auf Fläche = ${ratio.toFixed(2)}:1`);
      }
      const ratio = contrastRatio(theme.get('accent') ?? '', theme.get('bg') ?? '') ?? 0;
      assert.ok(ratio >= 3, `${name}: Akzent auf Hintergrund = ${ratio.toFixed(2)}:1`);
    });
  }
});

describe('Reduzierte Bewegung', () => {
  it('erzeugt keine Übergänge (sonst misst paginate() veraltete Höhen)', () => {
    const start = styles.indexOf('@media (prefers-reduced-motion: reduce)');
    assert.ok(start >= 0, 'Regel für reduzierte Bewegung fehlt');
    const block = styles.slice(start, styles.indexOf('\n}', start));
    const duration = /transition-duration:\s*([^;!]+)/.exec(block)?.[1]?.trim();
    assert.equal(duration, '0s');
  });
});

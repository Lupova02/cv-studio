// Barrierefreiheits-Prüfung der Oberfläche mit axe-core – offline in Electron, ohne Browser-Download.
// Prüft Desktop (1280 px) und Handy (390 px) jeweils hell und dunkel, dazu Menü, Qualitätscheck und Muster-Modus.
// Einmalig nötig: npm i -D playwright-core @axe-core/playwright
// Aufruf: npm run a11y   (baut vorher den Dev-Build nach dist-a11y/)
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let electron;
let AxeBuilder;
try {
  ({ _electron: electron } = await import('playwright-core'));
  ({ default: AxeBuilder } = await import('@axe-core/playwright'));
} catch {
  console.error('Für die Prüfung fehlen Entwicklungspakete: npm i -D playwright-core @axe-core/playwright');
  process.exit(2);
}

const app = await electron.launch({ args: [path.join(here, 'electron-host.cjs')] });
const page = await app.firstWindow();
const findings = [];

/** Führt axe aus und merkt Verstöße mit Ansicht. */
async function audit(view) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  for (const violation of result.violations) {
    findings.push({ view, id: violation.id, impact: violation.impact, help: violation.help, nodes: violation.nodes.map((node) => node.target.join(' ')).slice(0, 5) });
  }
  console.log(`${view}: ${result.violations.length} Verstöße`);
}

/** Lädt neu ohne Einstieg und wartet auf den Editor. */
async function reload() {
  await page.evaluate(() => localStorage.setItem('cv-studio.onboarded', '1'));
  await page.reload();
  await page.waitForSelector('.shell');
}

await page.waitForLoadState('domcontentloaded');
for (const scheme of ['light', 'dark']) {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  for (const [label, width, height] of [
    ['desktop', 1280, 800],
    ['handy', 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await reload();
    await audit(`${label}-${scheme}`);
    await page.click('app-quality-panel .trigger');
    await audit(`${label}-${scheme}-qualitaetscheck`);
    await page.keyboard.press('Escape');
    if (label === 'handy') {
      await page.click('.toolbar .more');
      await audit(`${label}-${scheme}-menue`);
      await page.click('.menu-row[role="switch"]');
      await page.keyboard.press('Escape');
      await audit(`${label}-${scheme}-muster`);
      await page.click('.sample-banner .btn-ghost');
      for (const tab of ['design', 'preview']) {
        await page.click(`#tab-${tab}`);
        await audit(`${label}-${scheme}-${tab}`);
      }
    }
  }
}
await app.close();

if (findings.length > 0) {
  console.log(JSON.stringify(findings, null, 2));
  process.exit(1);
}
console.log('Keine Verstöße gefunden.');

// Seitenumbruch-Logik: teilt eine fortlaufend gerenderte Vorlage in A4-Seiten auf, indem unsichtbare
// Abstandshalter vor Blöcke geschoben werden, die sonst über ein Seitenende laufen würden.
// Gleiche Logik für Editor-Vorschau (mit Abstand zwischen den Seiten) und PDF-Druck (ohne Abstand).

/** Ein Millimeter in CSS-Pixeln (96 dpi). */
const MM = 96 / 25.4;

/** Höhe einer A4-Seite in CSS-Pixeln. */
export const PAGE_HEIGHT = 297 * MM;
// Freizuhaltender Rand oben/unten auf Folgeseiten; dazwischen liegt die nutzbare Höhe.
const PAGE_TOP = 14 * MM;
const PAGE_BOTTOM = 14 * MM;
const USABLE = PAGE_HEIGHT - PAGE_TOP - PAGE_BOTTOM;

/**
 * Eine Einheit, die nicht über ein Seitenende geteilt werden soll.
 * `anchor` ist das Element, vor das der Abstandshalter kommt; `first`/`last` begrenzen den Block vertikal.
 */
interface Block {
  anchor: HTMLElement;
  first: HTMLElement;
  last: HTMLElement;
}

/** Überschriften (Abschnittstitel, Skill-Kategorien) dürfen nie allein am Seitenende stehen. */
function isHeading(element: Element): boolean {
  return element.tagName === 'H2' || element.classList.contains('skill-category');
}

/** Fasst Geschwister zu Blöcken zusammen; Überschriften werden mit dem jeweils folgenden Element verbunden. */
function keepWithNext(children: HTMLElement[]): Block[] {
  const blocks: Block[] = [];
  for (let index = 0; index < children.length; index++) {
    let end = index;
    while (isHeading(children[end]) && end + 1 < children.length) {
      end++;
    }
    blocks.push({ anchor: children[index], first: children[index], last: children[end] });
    index = end;
  }
  return blocks;
}

/** Sammelt alle Blöcke der Vorlage in Dokumentreihenfolge: zuerst die Seitenleiste (falls vorhanden), dann die Abschnitte. */
function collectBlocks(root: HTMLElement): Block[] {
  const blocks: Block[] = [];
  // Seitenleiste (Vorlage „Modern“): jedes Kind ist ein Block, Überschriften kleben am Folgeelement.
  const aside = root.querySelector('aside');
  if (aside) {
    blocks.push(...keepWithNext(Array.from(aside.children) as HTMLElement[]));
  }
  for (const section of Array.from(root.querySelectorAll<HTMLElement>('section'))) {
    const entries = Array.from(section.querySelectorAll<HTMLElement>('.entry'));
    // Abschnitte ohne Einträge (z. B. Tabellen für Sprachen/Skills) wandern als Ganzes.
    if (entries.length === 0) {
      blocks.push({ anchor: section, first: section, last: section });
      continue;
    }
    // Abschnittsanfang samt Überschrift bis einschließlich des ersten Eintrags, danach jeder Eintrag einzeln.
    blocks.push({ anchor: section, first: section, last: entries[0] });
    for (const entry of entries.slice(1)) {
      blocks.push({ anchor: entry, first: entry, last: entry });
    }
  }
  return blocks;
}

/** Schiebt einen Block per Abstandshalter nach unten, bis seine Oberkante bei `target` (px) liegt. */
function pushDown(block: Block, target: number, offset: (element: HTMLElement, edge: 'top' | 'bottom') => number): void {
  const spacer = document.createElement('div');
  spacer.className = 'page-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  // Ohne Übergang: Höhenänderungen müssen sofort messbar sein (siehe pushDown-Schleife).
  spacer.style.cssText = 'display:block;height:0;margin:0;padding:0;border:0;transition:none';
  const timeline = block.anchor.parentElement?.closest<HTMLElement>('.timeline');
  if (timeline) {
    // Überdeckt die Zeitleisten-Linie, damit sie über den Seitenumbruch hinweg unterbrochen ist.
    const rail = parseFloat(getComputedStyle(timeline).paddingLeft) || 0;
    spacer.style.position = 'relative';
    spacer.style.zIndex = '3';
    spacer.style.background = '#fff';
    spacer.style.marginLeft = `-${rail}px`;
  }
  block.anchor.before(spacer);
  // Schluckt den oberen Außenabstand des Ankers, damit der Abstandshalter bündig am verschobenen Block endet.
  const anchorMargin = parseFloat(getComputedStyle(block.anchor).marginTop) || 0;
  if (anchorMargin > 0) {
    spacer.style.marginBottom = `-${anchorMargin}px`;
  }
  // Höhe iterativ annähern: Margin-Collapsing und Grid-Layouts machen die Verschiebung nicht exakt vorhersagbar.
  let height = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const delta = target - offset(block.first, 'top');
    if (Math.abs(delta) < 0.5) {
      break;
    }
    height = Math.max(0, height + delta);
    spacer.style.height = `${height}px`;
  }
}

/**
 * Ordnet die Vorlage als untereinanderliegende A4-Seiten mit `gap` px Abstand an. Ein Block, der über ein
 * Seitenende reichen würde, wandert komplett auf die nächste Seite; eine Abschnittsüberschrift bleibt immer
 * bei ihrem ersten Eintrag. Gibt die Seitenzahl zurück und setzt die Höhe des Elements passend dazu.
 */
export function paginate(root: HTMLElement, gap: number): number {
  // Ergebnis eines früheren Durchlaufs entfernen, damit von der natürlichen Höhe aus gemessen wird.
  for (const spacer of Array.from(root.querySelectorAll('.page-spacer'))) {
    spacer.remove();
  }
  root.style.height = '';
  root.style.overflow = '';

  // `stride` = Abstand von Seitenanfang zu Seitenanfang. Die Vorschau kann per CSS-Transform skaliert sein;
  // `scale` rechnet gemessene Bildschirmpixel in ungeskalierte Layoutpixel zurück.
  const stride = PAGE_HEIGHT + gap;
  const frame = root.getBoundingClientRect();
  const scale = root.offsetHeight > 0 && frame.height > 0 ? frame.height / root.offsetHeight : 1;
  const offset = (element: HTMLElement, edge: 'top' | 'bottom') => (element.getBoundingClientRect()[edge] - frame.top) / scale;

  let contentBottom = 0;
  for (const block of collectBlocks(root)) {
    const top = offset(block.first, 'top');
    let bottom = offset(block.last, 'bottom');
    const page = Math.max(0, Math.floor(top / stride));
    const limit = page * stride + PAGE_HEIGHT - PAGE_BOTTOM;
    // Verschieben, wenn der Block über den unteren Rand ragt – aber nur, wenn er auf eine Seite passt
    // (sonst bliebe er auch auf der nächsten zu lang) oder erst im unteren Rand bzw. im Seitenzwischenraum beginnt.
    if (bottom > limit && (bottom - top <= USABLE || top > limit)) {
      pushDown(block, (page + 1) * stride + PAGE_TOP, offset);
      bottom = offset(block.last, 'bottom');
    }
    contentBottom = Math.max(contentBottom, bottom);
  }

  // Seitenzahl aus dem tiefsten Inhalt; das Element wird auf genau so viele ganze Seiten gestreckt und abgeschnitten.
  const pages = Math.max(1, Math.floor(Math.max(0, contentBottom - 1) / stride) + 1);
  root.style.height = `calc(${pages * 297}mm + ${(pages - 1) * gap}px)`;
  root.style.overflow = 'hidden';
  return pages;
}

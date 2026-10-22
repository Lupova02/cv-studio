// Bereitet gespeicherte Lebenslaufdaten für die Darstellung in einer Vorlage auf (Vorschau und PDF).
// Die gespeicherten Daten bleiben unverändert; ausgeblendete Angaben und Sortierung betreffen nur die Anzeige.
import type { CvData, ReferenceItem, TemplateOptions } from './cv-data';

/** Zeitraum eines Eintrags als 'YYYY-MM'-Texte; `''` = unbekannt. Texte im Format 'YYYY-MM' sind direkt vergleichbar. */
interface Period {
  end: string;
  start: string;
}

/** Laufende Einträge („bis heute“) gelten als neuer als jedes Enddatum. */
const ONGOING = '9999-12';

/** Ende und Beginn eines Eintrags; ohne Enddatum zählt der Beginn als Ende. */
function period(from: string, until: string, current: boolean): Period {
  return { end: current ? ONGOING : until || from, start: from };
}

/** Vergleicht absteigend nach Ende, dann nach Beginn; Einträge ganz ohne Datum landen am Schluss. */
function newestFirst(a: Period, b: Period): number {
  if (a.end !== b.end) {
    return a.end < b.end ? 1 : -1;
  }
  if (a.start !== b.start) {
    return a.start < b.start ? 1 : -1;
  }
  return 0;
}

/** Sortiert eine Kopie der Liste, neueste Einträge zuerst; bei gleichem Zeitraum bleibt die Editor-Reihenfolge. */
function sortNewest<T>(items: readonly T[], periodOf: (item: T) => Period): T[] {
  return items
    .map((item) => ({ item, period: periodOf(item) }))
    .sort((a, b) => newestFirst(a.period, b.period))
    .map((entry) => entry.item);
}

/** Eine Referenz zählt nur, wenn mindestens ein Feld ausgefüllt ist. */
function hasContent(item: ReferenceItem): boolean {
  return [item.name, item.position, item.company, item.email, item.phone].some((value) => value.trim().length > 0);
}

/**
 * Liefert die Daten so, wie die Vorlage sie anzeigen soll: ohne Geschlecht, wenn es ausgeblendet ist,
 * ohne leere Referenzen und ohne „Über mich“ aus reinen Leerzeichen. Bei `entryOrder: 'newest'` sind
 * Berufserfahrung, Ausbildung, Zertifikate und Projekte nach Datum sortiert.
 */
export function prepareForDisplay(data: CvData, options: Pick<TemplateOptions, 'showGender' | 'entryOrder'>): CvData {
  const shown: CvData = {
    ...data,
    personal: options.showGender ? data.personal : { ...data.personal, gender: '' },
    summary: data.summary.trim(),
    references: data.references.filter(hasContent),
  };
  if (options.entryOrder !== 'newest') {
    return shown;
  }
  return {
    ...shown,
    experience: sortNewest(data.experience, (item) => period(item.from, item.until, item.current)),
    education: sortNewest(data.education, (item) => period(item.from, item.until, item.current)),
    certificates: sortNewest(data.certificates, (item) => period(item.date, '', false)),
    projects: sortNewest(data.projects, (item) => period(item.from, item.until, false)),
  };
}

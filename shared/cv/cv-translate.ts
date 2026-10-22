// Übersetzt die selbst geschriebenen Texte eines Lebenslaufs in eine andere Sprache.
// Wird von der Angular-Oberfläche genutzt; die eigentliche Übersetzung (offline, Bergamot) wird als Funktion hereingereicht.
import { LIMITS, type CvData } from './cv-data';

/** Übersetzt eine Liste von Texten; das Ergebnis muss dieselbe Länge und Reihenfolge haben. */
export type TranslateTexts = (texts: string[]) => Promise<string[]>;

/** Lese-/Schreibzugriff auf ein einzelnes Textfeld im Lebenslauf samt seiner Längengrenze. */
interface TextField {
  read(): string;
  write(value: string): void;
  limit: number;
}

/** Erzeugt einen `TextField`-Zugriff auf eine Text-Eigenschaft eines Objekts; `key` erlaubt nur String-Felder. */
function field<T>(target: T, key: { [K in keyof T]: T[K] extends string ? K : never }[keyof T], limit: number): TextField {
  return {
    read: () => target[key] as string,
    write: (value) => {
      (target[key] as string) = value;
    },
    limit,
  };
}

/** Erzeugt je Stichpunkt einen `TextField`-Zugriff, der direkt in die Liste schreibt. */
function bulletFields(bullets: string[]): TextField[] {
  return bullets.map((_, index) => ({
    read: () => bullets[index],
    write: (value) => {
      bullets[index] = value;
    },
    limit: LIMITS.bullet,
  }));
}

/** Freitexte, die die Nutzerin selbst geschrieben hat (nur nicht-leere); Namen von Personen, Firmen, Schulen, Projekten und Orten bleiben unverändert. */
function translatableFields(cv: CvData): TextField[] {
  return [
    field(cv, 'summary', LIMITS.longText),
    ...cv.experience.flatMap((item) => [
      field(item, 'position', LIMITS.shortText),
      field(item, 'description', LIMITS.longText),
      ...bulletFields(item.bullets),
    ]),
    ...cv.education.flatMap((item) => [field(item, 'degree', LIMITS.shortText), field(item, 'description', LIMITS.longText)]),
    ...cv.certificates.map((item) => field(item, 'description', LIMITS.longText)),
    ...cv.projects.flatMap((item) => [field(item, 'description', LIMITS.longText), ...bulletFields(item.bullets)]),
    ...cv.references.map((item) => field(item, 'position', LIMITS.shortText)),
  ].filter((entry) => entry.read().trim().length > 0);
}

/** Anzahl der übersetzbaren, nicht-leeren Textfelder; wird im Übersetzen-Dialog angezeigt (0 = nichts zu übersetzen). */
export function countTranslatable(data: CvData): number {
  return translatableFields(data).length;
}

/**
 * Liefert eine übersetzte Kopie des Lebenslaufs; das Original bleibt unverändert.
 * Gleiche Texte werden nur einmal übersetzt. Leere Übersetzungen behalten den Originaltext,
 * zu lange werden auf die Feldgrenze gekürzt.
 */
export async function translateCv(data: CvData, translate: TranslateTexts): Promise<CvData> {
  const next = structuredClone(data);
  const fields = translatableFields(next);
  const unique = [...new Set(fields.map((entry) => entry.read()))];
  if (unique.length === 0) {
    return next;
  }
  const translated = await translate(unique);
  const lookup = new Map(unique.map((text, index) => [text, translated[index]?.trim() ? translated[index] : text]));
  for (const entry of fields) {
    const value = lookup.get(entry.read()) ?? entry.read();
    entry.write(value.length > entry.limit ? value.slice(0, entry.limit).trimEnd() : value);
  }
  return next;
}

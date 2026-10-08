// Katalog der auswählbaren Fremdsprachen und Sprachniveaus (Muttersprache, GER-Stufen A1–C2) in de/en/tr.
// Liefert Auswahllisten für den Editor, die Anzeige im Lebenslauf und die Zuordnung von Freitext aus älteren Daten.
import type { CvLanguage, LanguageItem } from '../cv/cv-data';
import { umlautSpelling } from './umlaut-spelling';

/** Ein Text in allen drei Lebenslauf-Sprachen. */
interface Localized {
  de: string;
  en: string;
  tr: string;
}

/** Interne Definition einer Sprache im Katalog. */
interface LanguageDef {
  id: string;
  name: Localized;
  /** Weitere Schreibweisen, unter denen die Sprache beim Import erkannt wird. */
  aliases?: string[];
}

/** Eine Sprache als Eintrag der Auswahlliste, bereits in die Lebenslauf-Sprache übersetzt. */
export interface LanguageChoice {
  id: string;
  name: string;
}

/** Ein Sprachniveau als Eintrag der Auswahlliste. */
export interface LanguageLevelChoice {
  id: string;
  name: string;
  /** Erklärung, wann dieses Niveau passt (Hilfetext im Editor). */
  when: string;
}

/** Eine gesprochene Sprache, fertig aufbereitet für die Anzeige im Lebenslauf. */
export interface SpokenLanguageView {
  id: string;
  name: string;
  /** Kurzform des Niveaus, z. B. 'C1' oder 'Muttersprache'; leer, wenn keins gewählt ist. */
  level: string;
}

const text = (de: string, en: string, tr: string): Localized => ({ de, en, tr });

/** Alle wählbaren Sprachen; die Reihenfolge hier bestimmt die gespeicherte Reihenfolge (siehe languagesInCatalogOrder). */
const LANGUAGES: LanguageDef[] = [
  language('de', 'Deutsch', 'German', 'Almanca', ['deutsch']),
  language('en', 'Englisch', 'English', 'İngilizce', ['englisch']),
  language('tr', 'Türkisch', 'Turkish', 'Türkçe', ['tuerkisch', 'turkisch']),
  language('fr', 'Französisch', 'French', 'Fransızca'),
  language('es', 'Spanisch', 'Spanish', 'İspanyolca'),
  language('it', 'Italienisch', 'Italian', 'İtalyanca'),
  language('pt', 'Portugiesisch', 'Portuguese', 'Portekizce'),
  language('nl', 'Niederländisch', 'Dutch', 'Felemenkçe'),
  language('pl', 'Polnisch', 'Polish', 'Lehçe'),
  language('ru', 'Russisch', 'Russian', 'Rusça'),
  language('uk', 'Ukrainisch', 'Ukrainian', 'Ukraynaca'),
  language('ar', 'Arabisch', 'Arabic', 'Arapça'),
  language('zh', 'Chinesisch', 'Chinese', 'Çince', ['mandarin']),
  language('ja', 'Japanisch', 'Japanese', 'Japonca'),
  language('ko', 'Koreanisch', 'Korean', 'Korece'),
  language('hi', 'Hindi', 'Hindi', 'Hintçe'),
  language('sv', 'Schwedisch', 'Swedish', 'İsveççe'),
  language('da', 'Dänisch', 'Danish', 'Danca'),
  language('no', 'Norwegisch', 'Norwegian', 'Norveççe'),
  language('fi', 'Finnisch', 'Finnish', 'Fince'),
  language('el', 'Griechisch', 'Greek', 'Yunanca'),
  language('cs', 'Tschechisch', 'Czech', 'Çekçe'),
  language('sk', 'Slowakisch', 'Slovak', 'Slovakça'),
  language('hu', 'Ungarisch', 'Hungarian', 'Macarca'),
  language('ro', 'Rumänisch', 'Romanian', 'Rumence'),
  language('bg', 'Bulgarisch', 'Bulgarian', 'Bulgarca'),
  language('hr', 'Kroatisch', 'Croatian', 'Hırvatça'),
  language('sr', 'Serbisch', 'Serbian', 'Sırpça'),
  language('bs', 'Bosnisch', 'Bosnian', 'Boşnakça'),
  language('sl', 'Slowenisch', 'Slovenian', 'Slovence'),
  language('sq', 'Albanisch', 'Albanian', 'Arnavutça'),
  language('mk', 'Mazedonisch', 'Macedonian', 'Makedonca'),
  language('lt', 'Litauisch', 'Lithuanian', 'Litvanca'),
  language('lv', 'Lettisch', 'Latvian', 'Letonca'),
  language('et', 'Estnisch', 'Estonian', 'Estonca'),
  language('is', 'Isländisch', 'Icelandic', 'İzlandaca'),
  language('ga', 'Irisch', 'Irish', 'İrlandaca'),
  language('mt', 'Maltesisch', 'Maltese', 'Maltaca'),
  language('ca', 'Katalanisch', 'Catalan', 'Katalanca'),
  language('eu', 'Baskisch', 'Basque', 'Baskça'),
  language('gl', 'Galicisch', 'Galician', 'Galiçyaca'),
  language('cy', 'Walisisch', 'Welsh', 'Galce'),
  language('lb', 'Luxemburgisch', 'Luxembourgish', 'Lüksemburgca'),
  language('he', 'Hebräisch', 'Hebrew', 'İbranice'),
  language('fa', 'Persisch', 'Persian', 'Farsça', ['farsi']),
  language('ur', 'Urdu', 'Urdu', 'Urduca'),
  language('bn', 'Bengalisch', 'Bengali', 'Bengalce'),
  language('pa', 'Panjabi', 'Punjabi', 'Pencapça'),
  language('ta', 'Tamil', 'Tamil', 'Tamilce'),
  language('vi', 'Vietnamesisch', 'Vietnamese', 'Vietnamca'),
  language('th', 'Thailändisch', 'Thai', 'Tayca'),
  language('id', 'Indonesisch', 'Indonesian', 'Endonezce'),
  language('ms', 'Malaiisch', 'Malay', 'Malayca'),
  language('tl', 'Filipino', 'Filipino', 'Filipince'),
  language('sw', 'Swahili', 'Swahili', 'Svahili'),
  language('af', 'Afrikaans', 'Afrikaans', 'Afrikaans'),
  language('am', 'Amharisch', 'Amharic', 'Amharca'),
  language('zu', 'Zulu', 'Zulu', 'Zuluca'),
  language('hy', 'Armenisch', 'Armenian', 'Ermenice'),
  language('ka', 'Georgisch', 'Georgian', 'Gürcüce'),
  language('az', 'Aserbaidschanisch', 'Azerbaijani', 'Azerbaycanca'),
  language('kk', 'Kasachisch', 'Kazakh', 'Kazakça'),
  language('uz', 'Usbekisch', 'Uzbek', 'Özbekçe'),
  language('ku', 'Kurdisch', 'Kurdish', 'Kürtçe'),
  language('ps', 'Paschtu', 'Pashto', 'Peştuca'),
  language('ne', 'Nepalesisch', 'Nepali', 'Nepalce'),
  language('si', 'Singhalesisch', 'Sinhala', 'Seylanca'),
  language('my', 'Birmanisch', 'Burmese', 'Birmanca'),
  language('km', 'Khmer', 'Khmer', 'Kmerce'),
  language('lo', 'Laotisch', 'Lao', 'Laoca'),
  language('mn', 'Mongolisch', 'Mongolian', 'Moğolca'),
  language('be', 'Belarussisch', 'Belarusian', 'Belarusça'),
  language('la', 'Latein', 'Latin', 'Latince'),
];

/**
 * Sprachniveaus von hoch nach niedrig. name = Bezeichnung in der Auswahlliste, cv = Kurzform im gedruckten Lebenslauf,
 * when = Hilfetext, aliases = Freitext-Schreibweisen für den Import.
 */
const LEVELS: Array<{ id: string; name: Localized; cv: Localized; when: Localized; aliases?: string[] }> = [
  level(
    'native',
    text('Muttersprache', 'Native', 'Anadili'),
    text('Muttersprache', 'Native', 'Anadili'),
    text(
      'Die Sprache, mit der Sie aufgewachsen sind oder die Sie wie eine Erstsprache beherrschen.',
      'The language you grew up with or use like a first language.',
      'Büyüdüğünüz ya da anadili gibi kullandığınız dil.',
    ),
    ['muttersprache', 'muttersprachlich', 'native', 'anadil', 'anadili', 'mother tongue'],
  ),
  level(
    'c2',
    text('C2 – Annähernd muttersprachlich', 'C2 – Mastery', 'C2 – Ana diline yakın'),
    text('C2', 'C2', 'C2'),
    text(
      'Sie verstehen praktisch alles und drücken auch feine Bedeutungen sicher aus.',
      'You understand virtually everything and can express fine shades of meaning.',
      'Neredeyse her şeyi anlar, ince anlam ayrımlarını da rahatça ifade edersiniz.',
    ),
    ['c2', 'annaehernd muttersprachlich', 'mastery'],
  ),
  level(
    'c1',
    text('C1 – Verhandlungssicher', 'C1 – Proficient', 'C1 – Akıcı'),
    text('C1', 'C1', 'C1'),
    text(
      'Sie sprechen im Beruf fließend und verstehen anspruchsvolle Texte, ohne ständig nach Worten zu suchen.',
      'You speak fluently at work and understand demanding texts without searching for words.',
      'İş hayatında akıcı konuşur, zor metinleri kelime aramadan anlarsınız.',
    ),
    ['c1', 'verhandlungssicher', 'fachkundig', 'fliessend', 'fluent'],
  ),
  level(
    'b2',
    text('B2 – Selbstständig', 'B2 – Independent', 'B2 – Bağımsız'),
    text('B2', 'B2', 'B2'),
    text(
      'Sie folgen komplexen Gesprächen und Texten und sprechen sicher über vertraute und fachliche Themen.',
      'You follow complex talk and text and speak confidently about familiar and professional topics.',
      'Karmaşık konuşma ve metinleri takip eder, bildiğiniz ve mesleki konularda rahat konuşursunuz.',
    ),
    ['b2', 'selbststaendig', 'selbstaendig'],
  ),
  level(
    'b1',
    text('B1 – Fortgeschritten', 'B1 – Intermediate', 'B1 – Orta'),
    text('B1', 'B1', 'B1'),
    text(
      'Sie verstehen das Wesentliche vertrauter Themen und kommen im Alltag, auf Reisen und bei der Arbeit zurecht.',
      'You grasp the main points of familiar topics and manage everyday life, travel and work.',
      'Tanıdık konuların ana fikrini anlar, günlük yaşamda, seyahatte ve işte idare edersiniz.',
    ),
    ['b1', 'fortgeschritten', 'gute kenntnisse', 'gut'],
  ),
  level(
    'a2',
    text('A2 – Grundkenntnisse', 'A2 – Elementary', 'A2 – Temel'),
    text('A2', 'A2', 'A2'),
    text(
      'Sie verstehen häufige Sätze und können sich in einfachen, direkten Situationen verständigen.',
      'You understand common sentences and can communicate in simple, direct situations.',
      'Sık kullanılan cümleleri anlar, basit ve doğrudan durumlarda iletişim kurarsınız.',
    ),
    ['a2', 'grundkenntnisse', 'elementary', 'temel', 'basic'],
  ),
  level(
    'a1',
    text('A1 – Einstieg', 'A1 – Beginner', 'A1 – Başlangıç'),
    text('A1', 'A1', 'A1'),
    text(
      'Sie verstehen und verwenden sehr einfache Sätze für konkrete Alltagssituationen.',
      'You understand and use very simple sentences for concrete everyday needs.',
      'Somut günlük ihtiyaçlar için çok basit cümleleri anlar ve kullanırsınız.',
    ),
    ['a1', 'anfaenger', 'beginner', 'einstieg', 'baslangic'],
  ),
];

/** Kurzschreibweise zum Anlegen eines Katalogeintrags für eine Sprache. */
function language(id: string, de: string, en: string, tr: string, aliases: string[] = []): LanguageDef {
  return { id, name: text(de, en, tr), aliases };
}

/** Kurzschreibweise zum Anlegen eines Sprachniveaus. */
function level(
  id: string,
  name: Localized,
  cv: Localized,
  when: Localized,
  aliases: string[] = [],
): (typeof LEVELS)[number] {
  return { id, name, cv, when, aliases };
}

/** Normalisiert Text für den Vergleich: ohne Akzente, kleingeschrieben, Sonderzeichen zu einzelnen Leerzeichen. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/ +/g, ' ');
}

/** Normalisierte Schreibweise → Sprach-ID bzw. Niveau-ID; wird unten beim Laden des Moduls gefüllt. */
const LANGUAGE_ALIASES = new Map<string, string>();
const LEVEL_ALIASES = new Map<string, string>();

/** Trägt eine Schreibweise ein; wirft einen Fehler, wenn sie schon für einen anderen Eintrag vergeben ist (fällt so sofort beim Start auf). */
function register(map: Map<string, string>, key: string, id: string): void {
  const folded = fold(key);
  if (!folded) {
    return;
  }
  const existing = map.get(folded);
  if (existing && existing !== id) {
    throw new Error(`Sprach-Alias kollidiert: ${key}`);
  }
  map.set(folded, id);
}

for (const entry of LANGUAGES) {
  register(LANGUAGE_ALIASES, entry.id, entry.id);
  register(LANGUAGE_ALIASES, entry.name.de, entry.id);
  register(LANGUAGE_ALIASES, entry.name.en, entry.id);
  register(LANGUAGE_ALIASES, entry.name.tr, entry.id);
  for (const alias of entry.aliases ?? []) {
    register(LANGUAGE_ALIASES, alias, entry.id);
  }
}

for (const entry of LEVELS) {
  register(LEVEL_ALIASES, entry.id, entry.id);
  register(LEVEL_ALIASES, entry.name.de, entry.id);
  register(LEVEL_ALIASES, entry.name.en, entry.id);
  register(LEVEL_ALIASES, entry.name.tr, entry.id);
  register(LEVEL_ALIASES, entry.cv.de, entry.id);
  for (const alias of entry.aliases ?? []) {
    register(LEVEL_ALIASES, alias, entry.id);
  }
}

/** Sucht einen beliebigen (auch ungültigen) Wert in der Alias-Tabelle; null, wenn kein Text oder kein Treffer. */
function lookup(map: Map<string, string>, value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  return map.get(fold(value)) ?? map.get(fold(umlautSpelling(value))) ?? null;
}

/** Ermittelt die Sprach-ID aus ID, Name (de/en/tr) oder Alias, z. B. 'Englisch' → 'en'; null, wenn unbekannt. Für Import/Migration. */
export function languageIdFrom(value: unknown): string | null {
  return lookup(LANGUAGE_ALIASES, value);
}

/** Ermittelt die Niveau-ID aus ID, Bezeichnung oder Alias, z. B. 'verhandlungssicher' → 'c1'; null, wenn unbekannt. */
export function levelIdFrom(value: unknown): string | null {
  return lookup(LEVEL_ALIASES, value);
}

/** Alle Sprachen für die Auswahlliste, übersetzt und alphabetisch sortiert in der Lebenslauf-Sprache. */
export function languageCatalog(languageCode: CvLanguage): LanguageChoice[] {
  return LANGUAGES.map((entry) => ({ id: entry.id, name: entry.name[languageCode] })).sort((a, b) =>
    a.name.localeCompare(b.name, languageCode),
  );
}

/** Alle Sprachniveaus (von Muttersprache bis A1) mit Hilfetext für die Auswahlliste. */
export function languageLevels(languageCode: CvLanguage): LanguageLevelChoice[] {
  return LEVELS.map((entry) => ({
    id: entry.id,
    name: entry.name[languageCode],
    when: entry.when[languageCode],
  }));
}

/** Hilfetext, wann ein Niveau passt; leer bei unbekannter ID. */
export function levelWhen(level: string, languageCode: CvLanguage): string {
  return LEVELS.find((entry) => entry.id === level)?.when[languageCode] ?? '';
}

/** Wandelt eine Auswahl (Sprach-ID → Niveau-ID) in die gespeicherte Liste um – in fester Katalog-Reihenfolge, unbekannte IDs entfallen. */
export function languagesInCatalogOrder(chosen: Map<string, string>): LanguageItem[] {
  return LANGUAGES.flatMap((entry) => (chosen.has(entry.id) ? [{ id: entry.id, level: chosen.get(entry.id) ?? '' }] : []));
}

/** Gespeicherte Sprachen für die Anzeige im Lebenslauf: übersetzt, mit Niveau-Kurzform, alphabetisch sortiert; unbekannte IDs entfallen. */
export function languageEntries(items: LanguageItem[], languageCode: CvLanguage): SpokenLanguageView[] {
  const catalog = new Map(languageCatalog(languageCode).map((entry) => [entry.id, entry.name]));
  const levels = new Map(LEVELS.map((entry) => [entry.id, entry.cv[languageCode]]));
  return items
    .flatMap((item) => {
      const name = catalog.get(item.id);
      if (!name) {
        return [];
      }
      return [{ id: item.id, name, level: levels.get(item.level) ?? '' }];
    })
    .sort((a, b) => a.name.localeCompare(b.name, languageCode));
}

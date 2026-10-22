// Prüft und bereinigt beliebige eingelesene Lebenslaufdaten (gespeicherte Datei, Sicherung, IPC-Nachricht)
// und bringt alte oder fremde Datenstände auf das aktuelle Schema. Genutzt vom Hauptprozess und der Oberfläche.
import {
  DEFAULT_ACCENT,
  LIMITS,
  MAX_NATIONALITIES,
  MAX_PHONES,
  OTHER_NATIONALITY,
  PHONE_KINDS,
  SCHEMA_VERSION,
  TEMPLATE_IDS,
  type CertificateItem,
  type CvData,
  type CvLanguage,
  type Gender,
  type NationalityEntry,
  type PhoneEntry,
  type PhoneKind,
  type PostalAddress,
  type EducationItem,
  type ExperienceItem,
  type LanguageItem,
  type PersonalInfo,
  type ProjectItem,
  type ReferenceItem,
  type SkillItem,
  type TemplateId,
  CV_FONTS,
  ENTRY_ORDERS,
  SKILL_SCALES,
  type EntryOrder,
  PAGE_NUMBER_PLACES,
  PAGE_NUMBER_STYLES,
  type CvFont,
  type PageNumberPlace,
  type PageNumberStyle,
  type DatePlace,
  type SkillScale,
  type TimelineStyle,
  type TemplateSettings,
  createId,
  emptyAddress,
  emptyCv,
  emptyPersonal,
} from './cv-data';
import { countryDial, countryForDial, countryRecord, matchCountry } from '../catalogs/country-data';
import { languageIdFrom, languagesInCatalogOrder, levelIdFrom } from '../catalogs/language-catalog';
import { skillIdFrom, skillsInCatalogOrder, starsFromLevel } from '../catalogs/skill-catalog';

/** Fehler für ungültige Daten; die Meldung ist für Nutzer formuliert und kann direkt angezeigt werden. */
export class CvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CvValidationError';
  }
}

/** Prüft, ob der Wert ein einfaches Objekt ist (kein Array, nicht `null`). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Liefert den getrimmten Text; fehlend = `''`, wirft bei Nicht-Text oder Überlänge. `label` erscheint in der Fehlermeldung. */
function asText(value: unknown, max: number, label: string): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string') {
    throw new CvValidationError(`${label} muss ein Text sein.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new CvValidationError(`${label} ist zu lang (höchstens ${max} Zeichen).`);
  }
  return trimmed;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Übernimmt eine gültige ID (nur Buchstaben, Ziffern, Bindestrich) oder vergibt eine neue. */
function asId(value: unknown): string {
  if (typeof value === 'string' && value.length > 0 && value.length <= LIMITS.id && /^[0-9a-zA-Z-]+$/.test(value)) {
    return value;
  }
  return createId();
}

/** Liefert die Liste ungeprüfter Einträge; fehlend = leer, wirft bei Nicht-Liste oder mehr als `LIMITS.items` Einträgen. */
function asList(value: unknown, label: string): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new CvValidationError(`${label} muss eine Liste sein.`);
  }
  if (value.length > LIMITS.items) {
    throw new CvValidationError(`${label} darf höchstens ${LIMITS.items} Einträge haben.`);
  }
  return value;
}

/** Übernimmt einen Monat im Format 'YYYY-MM'; alles andere wird stillschweigend zu `''`. */
function asMonth(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return '';
  }
  return value;
}

/** Übernimmt ein Datum im Format 'YYYY-MM-DD', wenn es im Kalender existiert; sonst `''`. */
function asDate(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
    return '';
  }
  const [year, month, day] = value.split('-').map((part) => Number(part));
  // Date verschiebt ungültige Tage (z. B. 31.02.) in den Folgemonat; ein Rückvergleich deckt das auf.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return '';
  }
  return value;
}

/** Übernimmt eine Hex-Farbe '#rrggbb' (kleingeschrieben), sonst die Standard-Akzentfarbe. */
function asAccent(value: unknown): string {
  if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  return DEFAULT_ACCENT;
}

function asLanguage(value: unknown): CvLanguage {
  return value === 'en' || value === 'tr' ? value : 'de';
}

function asGender(value: unknown): Gender {
  return value === 'female' || value === 'male' || value === 'diverse' ? value : '';
}

function asTemplateId(value: unknown): TemplateId {
  if (typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value)) {
    return value as TemplateId;
  }
  return 'classic';
}

/** Erlaubte Foto-Dateinamen: UUID plus '.png', damit keine Pfade oder fremden Dateien eingeschleust werden. */
const PHOTO_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/i;

/** Übernimmt einen gültigen Foto-Dateinamen, sonst `''` (kein Foto). */
function asPhotoFile(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value !== 'string' || !PHOTO_FILE.test(value)) {
    return '';
  }
  return value;
}

/** Prüft eine Stichpunktliste; wirft bei Nicht-Liste, zu vielen oder zu langen Stichpunkten. */
function asBullets(value: unknown): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new CvValidationError('Stichpunkte müssen eine Liste sein.');
  }
  if (value.length > LIMITS.bullets) {
    throw new CvValidationError(`Ein Eintrag darf höchstens ${LIMITS.bullets} Stichpunkte haben.`);
  }
  return value.map((entry, index) => asText(entry, LIMITS.bullet, `Stichpunkt ${index + 1}`));
}

/** Übernimmt einen ISO-Ländercode, der im Länderkatalog existiert (auch kleingeschrieben, z. B. 'de'), sonst `''`. */
function asCountry(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const code = value.trim().toUpperCase();
  return countryRecord(code) ? code : '';
}

/** Vergibt bei doppelten IDs innerhalb einer Liste neue, denn die Oberfläche unterscheidet Einträge über ihre ID. */
function withUniqueIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    let id = createId();
    while (seen.has(id)) {
      id = createId();
    }
    seen.add(id);
    return { ...item, id };
  });
}

function asPhoneKind(value: unknown): PhoneKind {
  return typeof value === 'string' && (PHONE_KINDS as readonly string[]).includes(value) ? (value as PhoneKind) : '';
}

/** Bereinigt eine Staatsangehörigkeit; Freitext bleibt nur bei `OTHER_NATIONALITY` erhalten. */
function migrateNationality(value: unknown): NationalityEntry {
  const source = isRecord(value) ? value : {};
  const custom = asText(source['custom'], LIMITS.nationality, 'Staatsangehörigkeit');
  const code = source['code'] === OTHER_NATIONALITY ? OTHER_NATIONALITY : asCountry(source['code']);
  return { code, custom: code === OTHER_NATIONALITY ? custom : '' };
}

/**
 * Liefert die Staatsangehörigkeiten (immer mindestens einen Eintrag). Ältere Stände hatten ein einzelnes
 * Textfeld `nationality`; passt es zu einem Land, wird der Ländercode genommen, sonst bleibt es Freitext.
 */
function migrateNationalities(source: Record<string, unknown>): NationalityEntry[] {
  if (Array.isArray(source['nationalities'])) {
    const entries = source['nationalities'].slice(0, MAX_NATIONALITIES).map((entry) => migrateNationality(entry));
    return entries.length > 0 ? entries : [{ code: '', custom: '' }];
  }
  const legacy = asText(source['nationality'], LIMITS.nationality, 'Staatsangehörigkeit');
  if (!legacy) {
    return [{ code: '', custom: '' }];
  }
  const code = matchCountry(legacy);
  return code ? [{ code, custom: '' }] : [{ code: OTHER_NATIONALITY, custom: legacy }];
}

/** Bereinigt eine Telefonnummer; ohne gültige ID wird eine stabile ID aus der Position gebildet. */
function migratePhone(value: unknown, index: number): PhoneEntry {
  const source = isRecord(value) ? value : {};
  const country = asCountry(source['country']);
  // Bei bekanntem Land gilt immer dessen Vorwahl aus dem Katalog, damit Land und Vorwahl nicht auseinanderlaufen.
  const dial = country ? countryDial(country) : asText(source['dial'], 8, 'Vorwahl');
  const id = typeof source['id'] === 'string' && source['id'].length > 0 ? asId(source['id']) : `phone-${index + 1}`;
  return {
    id,
    country,
    dial,
    number: asText(source['number'], LIMITS.phone, 'Telefon'),
    kind: asPhoneKind(source['kind']),
  };
}

/** Zerlegt eine alte Telefonnummer als Freitext (z. B. '+49 172 …') in Vorwahl, Land und Rufnummer. */
function legacyPhone(value: string): PhoneEntry {
  const match = /^(\+\d{1,4})\s*(.*)$/.exec(value.trim());
  if (!match) {
    return { id: 'legacy-phone', country: '', dial: '', number: value.trim(), kind: '' };
  }
  const dial = match[1] ?? '';
  const country = countryForDial(dial);
  return { id: 'legacy-phone', country, dial: country ? countryDial(country) : dial, number: (match[2] ?? '').trim(), kind: '' };
}

/** Liefert höchstens `MAX_PHONES` Telefonnummern; ältere Stände hatten nur ein Textfeld `phone`. */
function migratePhones(source: Record<string, unknown>): PhoneEntry[] {
  if (Array.isArray(source['phones'])) {
    return withUniqueIds(source['phones'].slice(0, MAX_PHONES).map((entry, index) => migratePhone(entry, index)));
  }
  const legacy = typeof source['phone'] === 'string' ? asText(source['phone'], LIMITS.phone, 'Telefon') : '';
  return legacy ? [legacyPhone(legacy)] : [];
}

/** Bereinigt die Anschrift; eine alte Adresse als einzelner Text landet komplett im Feld `street`. */
function migrateAddress(value: unknown): PostalAddress {
  if (typeof value === 'string') {
    return { ...emptyAddress(), street: asText(value, LIMITS.address, 'Adresse') };
  }
  const source = isRecord(value) ? value : {};
  return {
    country: asCountry(source['country']),
    street: asText(source['street'], LIMITS.address, 'Straße'),
    houseNumber: asText(source['houseNumber'], LIMITS.shortText, 'Hausnummer'),
    postalCode: asText(source['postalCode'], LIMITS.shortText, 'PLZ'),
    city: asText(source['city'], LIMITS.shortText, 'Stadt'),
    region: asText(source['region'], LIMITS.shortText, 'Region'),
    neighborhood: asText(source['neighborhood'], LIMITS.shortText, 'Mahalle'),
    apartment: asText(source['apartment'], LIMITS.shortText, 'Wohnung'),
    district: asText(source['district'], LIMITS.shortText, 'İlçe'),
    province: asText(source['province'], LIMITS.shortText, 'İl'),
  };
}

/** Bereinigt die persönlichen Angaben; fehlende Felder werden leer. */
function migratePersonal(value: unknown): PersonalInfo {
  const source = isRecord(value) ? value : {};
  const base = emptyPersonal();
  return {
    firstName: asText(source['firstName'], LIMITS.shortText, 'Vorname'),
    lastName: asText(source['lastName'], LIMITS.shortText, 'Nachname'),
    email: asText(source['email'], LIMITS.email, 'E-Mail'),
    phones: migratePhones(source),
    address: source['address'] === undefined ? base.address : migrateAddress(source['address']),
    birthDate: asDate(source['birthDate']),
    birthPlace: asText(source['birthPlace'], LIMITS.shortText, 'Geburtsort'),
    nationalities: migrateNationalities(source),
    gender: asGender(source['gender']),
    linkedIn: asText(source['linkedIn'], LIMITS.url, 'LinkedIn'),
    github: asText(source['github'], LIMITS.url, 'GitHub'),
    website: asText(source['website'], LIMITS.url, 'Website'),
    photoFile: source['photoFile'] === undefined ? base.photoFile : asPhotoFile(source['photoFile']),
  };
}

/**
 * Ermittelt Land und Stadt einer Berufsstation. Ältere Stände hatten nur ein Freitextfeld `location`
 * (z. B. 'Hamburg, Deutschland'); daraus wird, wenn möglich, ein Ländercode abgeleitet.
 */
function migrateWorkplace(source: Record<string, unknown>): { country: string; city: string } {
  const country = asCountry(source['country']);
  const city = typeof source['city'] === 'string' ? asText(source['city'], LIMITS.shortText, 'Stadt') : '';
  // Sobald das neue Format erkennbar ist, wird `location` ignoriert.
  if (country || typeof source['city'] === 'string') {
    return { country, city };
  }
  const legacy = asText(source['location'], LIMITS.shortText, 'Ort');
  const direct = matchCountry(legacy);
  if (direct) {
    return { country: direct, city: '' };
  }
  // Nur der letzte Teil nach einem Komma wird als Land gedeutet; der Rest bleibt die Stadt.
  const parts = legacy.split(',').map((part) => part.trim()).filter((part) => part.length > 0);
  const tail = matchCountry(parts.at(-1) ?? '');
  if (parts.length > 1 && tail) {
    return { country: tail, city: asText(parts.slice(0, -1).join(', '), LIMITS.shortText, 'Stadt') };
  }
  return { country: '', city: legacy };
}

function migrateExperience(value: unknown): ExperienceItem {
  const source = isRecord(value) ? value : {};
  const place = migrateWorkplace(source);
  return {
    id: asId(source['id']),
    company: asText(source['company'], LIMITS.shortText, 'Firma'),
    position: asText(source['position'], LIMITS.shortText, 'Position'),
    country: place.country,
    city: place.city,
    from: asMonth(source['from']),
    until: asMonth(source['until']),
    current: asBoolean(source['current'], false),
    description: asText(source['description'], LIMITS.longText, 'Beschreibung'),
    bullets: asBullets(source['bullets']),
  };
}

function migrateEducation(value: unknown): EducationItem {
  const source = isRecord(value) ? value : {};
  return {
    id: asId(source['id']),
    institution: asText(source['institution'], LIMITS.shortText, 'Institution'),
    degree: asText(source['degree'], LIMITS.shortText, 'Abschluss'),
    location: asText(source['location'], LIMITS.shortText, 'Ort'),
    from: asMonth(source['from']),
    until: asMonth(source['until']),
    current: asBoolean(source['current'], false),
    description: asText(source['description'], LIMITS.longText, 'Beschreibung'),
  };
}

/**
 * Ordnet Kenntnisse dem Katalog zu (per ID oder altem Freitext-Namen) und sortiert sie in Katalog-Reihenfolge.
 * Unbekannte Kenntnisse entfallen, doppelte überschreiben frühere; ohne erkennbare Stufe gelten 3 Sterne.
 */
function migrateSkills(value: unknown): SkillItem[] {
  const chosen = new Map<string, number>();
  for (const entry of asList(value, 'Kenntnisse')) {
    const source = isRecord(entry) ? entry : {};
    const id = skillIdFrom(source['id']) ?? skillIdFrom(source['name']);
    if (!id) {
      continue;
    }
    chosen.set(id, starsFromLevel(source['stars'] ?? source['level']) ?? 3);
  }
  return skillsInCatalogOrder(chosen);
}

/**
 * Ordnet Sprachen dem Sprachkatalog zu (per ID oder altem Freitext-Namen) und sortiert sie in Katalog-Reihenfolge.
 * Unbekannte Sprachen entfallen; ein nicht erkennbares Niveau wird zu `''`.
 */
function migrateLanguages(value: unknown): LanguageItem[] {
  const chosen = new Map<string, string>();
  for (const entry of asList(value, 'Sprachen')) {
    const source = isRecord(entry) ? entry : {};
    const id = languageIdFrom(source['id']) ?? languageIdFrom(source['language']);
    if (!id) {
      continue;
    }
    chosen.set(id, levelIdFrom(source['level']) ?? '');
  }
  return languagesInCatalogOrder(chosen);
}

function migrateCertificate(value: unknown): CertificateItem {
  const source = isRecord(value) ? value : {};
  return {
    id: asId(source['id']),
    name: asText(source['name'], LIMITS.shortText, 'Zertifikat'),
    issuer: asText(source['issuer'], LIMITS.shortText, 'Aussteller'),
    date: asMonth(source['date']),
    description: asText(source['description'], LIMITS.longText, 'Beschreibung'),
  };
}

function migrateProject(value: unknown): ProjectItem {
  const source = isRecord(value) ? value : {};
  return {
    id: asId(source['id']),
    name: asText(source['name'], LIMITS.shortText, 'Projekt'),
    url: asText(source['url'], LIMITS.url, 'Projekt-URL'),
    from: asMonth(source['from']),
    until: asMonth(source['until']),
    description: asText(source['description'], LIMITS.longText, 'Beschreibung'),
    bullets: asBullets(source['bullets']),
  };
}

function migrateReference(value: unknown): ReferenceItem {
  const source = isRecord(value) ? value : {};
  return {
    id: asId(source['id']),
    name: asText(source['name'], LIMITS.shortText, 'Name der Referenz'),
    position: asText(source['position'], LIMITS.shortText, 'Position der Referenz'),
    company: asText(source['company'], LIMITS.shortText, 'Firma der Referenz'),
    email: asText(source['email'], LIMITS.email, 'E-Mail der Referenz'),
    phone: asText(source['phone'], LIMITS.phone, 'Telefon der Referenz'),
  };
}

function asSkillScale(value: unknown): SkillScale {
  return typeof value === 'string' && (SKILL_SCALES as readonly string[]).includes(value) ? (value as SkillScale) : 'stars';
}

function asEntryOrder(value: unknown): EntryOrder {
  return typeof value === 'string' && (ENTRY_ORDERS as readonly string[]).includes(value) ? (value as EntryOrder) : 'manual';
}

function asDatePlace(value: unknown): DatePlace {
  return value === 'below' ? 'below' : 'aside';
}

function asTimeline(value: unknown): TimelineStyle {
  return value === 'off' ? 'off' : 'line';
}

function asFont(value: unknown): CvFont {
  return typeof value === 'string' && (CV_FONTS as readonly string[]).includes(value) ? (value as CvFont) : 'sourceSans';
}

function asPageNumbers(value: unknown): PageNumberStyle {
  return typeof value === 'string' && (PAGE_NUMBER_STYLES as readonly string[]).includes(value) ? (value as PageNumberStyle) : 'fraction';
}

function asPageNumberPlace(value: unknown): PageNumberPlace {
  return typeof value === 'string' && (PAGE_NUMBER_PLACES as readonly string[]).includes(value) ? (value as PageNumberPlace) : 'right';
}

/** Bereinigt die Gestaltungseinstellungen; unbekannte Werte fallen auf die Standardwerte von `emptyCv` zurück. */
function migrateTemplate(value: unknown): TemplateSettings {
  const source = isRecord(value) ? value : {};
  return {
    templateId: asTemplateId(source['templateId']),
    showPhoto: asBoolean(source['showPhoto'], true),
    showGender: asBoolean(source['showGender'], true),
    accentColor: asAccent(source['accentColor']),
    language: asLanguage(source['language']),
    skillScale: asSkillScale(source['skillScale']),
    datePlace: asDatePlace(source['datePlace']),
    timeline: asTimeline(source['timeline']),
    entryOrder: asEntryOrder(source['entryOrder']),
    font: asFont(source['font']),
    pageNumbers: asPageNumbers(source['pageNumbers']),
    pageNumberPlace: asPageNumberPlace(source['pageNumberPlace']),
  };
}

/**
 * Wandelt beliebige Rohdaten in einen gültigen Lebenslauf im aktuellen Schema um.
 * `undefined`/`null` ergibt einen leeren Lebenslauf. Kleinere Mängel werden still korrigiert (z. B. ungültiges
 * Datum = leer); bei grob falschen Daten (falscher Typ, zu lang, zu viele Einträge, neuere Version)
 * wird ein `CvValidationError` mit verständlicher Meldung geworfen.
 */
export function migrate(raw: unknown): CvData {
  if (raw === undefined || raw === null) {
    return emptyCv();
  }
  if (!isRecord(raw)) {
    throw new CvValidationError('Die Lebenslaufdaten müssen ein Objekt sein.');
  }
  if (typeof raw['schemaVersion'] === 'number' && raw['schemaVersion'] > SCHEMA_VERSION) {
    throw new CvValidationError('Diese Datei stammt aus einer neueren Programmversion und kann nicht geöffnet werden.');
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    personal: migratePersonal(raw['personal']),
    summary: asText(raw['summary'], LIMITS.longText, 'Über mich'),
    experience: withUniqueIds(asList(raw['experience'], 'Berufserfahrung').map((entry) => migrateExperience(entry))),
    education: withUniqueIds(asList(raw['education'], 'Ausbildung').map((entry) => migrateEducation(entry))),
    skills: migrateSkills(raw['skills']),
    languages: migrateLanguages(raw['languages']),
    certificates: withUniqueIds(asList(raw['certificates'], 'Zertifikate').map((entry) => migrateCertificate(entry))),
    projects: withUniqueIds(asList(raw['projects'], 'Projekte').map((entry) => migrateProject(entry))),
    references: withUniqueIds(asList(raw['references'], 'Referenzen').map((entry) => migrateReference(entry))),
    template: migrateTemplate(raw['template']),
  };
}

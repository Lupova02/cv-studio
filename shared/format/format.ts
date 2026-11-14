// Darstellungs-Hilfen für die Lebenslauf-Vorlagen: Datumsangaben, persönliche Daten, Kontakt- und Adresszeilen, Seitenzahlen.
// Alle Texte werden in der Sprache des Lebenslaufs (de/en/tr) erzeugt; leere Angaben werden stillschweigend weggelassen.
import { addressFields, type AddressValueKey } from './address-format';
import { countryName, nationalityAdjective } from '../catalogs/country-data';
import { OTHER_NATIONALITY, type CvLanguage, type PageNumberStyle, type PersonalInfo, type PhoneKind, type PostalAddress } from '../cv/cv-data';
import { genderLabel, labelsFor, phoneKindLabel } from '../i18n/labels';

/** Locale für Intl.DateTimeFormat je Lebenslauf-Sprache (Englisch bewusst britisch: Tag vor Monat). */
const DATE_LOCALE: Record<CvLanguage, string> = {
  de: 'de-DE',
  en: 'en-GB',
  tr: 'tr-TR',
};

/** Formatiert 'JJJJ-MM' als kurzen Monat mit Jahr, z. B. 'Apr. 2022'; leer bei ungültiger Eingabe. */
export function formatYearMonth(value: string, language: CvLanguage): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return '';
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  // In UTC rechnen, damit die lokale Zeitzone den Monat nicht verschieben kann.
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(DATE_LOCALE[language], {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Formatiert 'JJJJ-MM-TT' als ausgeschriebenes Datum, z. B. '3. März 1990'; leer bei ungültiger Eingabe. */
export function formatFullDate(value: string, language: CvLanguage): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return '';
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(DATE_LOCALE[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Formatiert einen Zeitraum wie 'Apr. 2022 – heute'; fehlt Anfang oder Ende, wird nur der vorhandene Teil gezeigt. */
export function formatRange(from: string, until: string, current: boolean, language: CvLanguage): string {
  const start = formatYearMonth(from, language);
  const end = current ? labelsFor(language).present : formatYearMonth(until, language);
  if (!start && !end) {
    return '';
  }
  if (!start) {
    return end;
  }
  if (!end) {
    return start;
  }
  return `${start} – ${end}`;
}

/** Staatsangehörigkeiten als Adjektive in der Lebenslauf-Sprache; bei „Sonstige“ wird der frei eingegebene Text verwendet. */
export function nationalityNames(person: PersonalInfo, language: CvLanguage): string[] {
  return person.nationalities
    .map((entry) => (entry.code === OTHER_NATIONALITY ? entry.custom.trim() : nationalityAdjective(entry.code, language)))
    .filter((name) => name.length > 0);
}

/** Einzeilige Angabe wie 'Staatsangehörigkeit: Deutsch · Türkisch'; leer, wenn keine angegeben ist. */
export function nationalityLine(person: PersonalInfo, language: CvLanguage): string {
  const names = nationalityNames(person, language);
  if (names.length === 0) {
    return '';
  }
  return `${labelsFor(language).nationality}: ${names.join(' · ')}`;
}

/** Ein Eintrag im Block „Persönliche Daten“ (z. B. Geburtsdatum) mit Beschriftung und Wert. */
export interface PersonalFact {
  label: string;
  value: string;
  /** Mehrere Einzelwerte (z. B. zwei Staatsangehörigkeiten); dann ist value leer. */
  details: string[];
}

/** Einträge für den Block „Persönliche Daten“: Geschlecht, Geburtsdatum, Geburtsort, Staatsangehörigkeit – nur, soweit ausgefüllt. */
export function personalFactItems(person: PersonalInfo, language: CvLanguage): PersonalFact[] {
  const labels = labelsFor(language);
  const gender = genderLabel(person.gender, labels);
  const items: PersonalFact[] = [];
  if (gender) {
    items.push({ label: labels.gender, value: gender, details: [] });
  }
  if (person.birthDate) {
    items.push({ label: labels.birthDate, value: formatFullDate(person.birthDate, language), details: [] });
  }
  if (person.birthPlace) {
    items.push({ label: labels.birthPlace, value: person.birthPlace, details: [] });
  }
  const nationalities = nationalityNames(person, language);
  if (nationalities.length > 0) {
    items.push({ label: labels.nationality, value: '', details: nationalities });
  }
  return items;
}

/** Telefonnummern als Textzeilen wie 'Handy: +49 170 1234567'; Nummern ohne Art erscheinen ohne Beschriftung. */
export function phoneLines(person: PersonalInfo, language: CvLanguage): string[] {
  const labels = labelsFor(language);
  return person.phones
    .map((phone) => {
      const number = [phone.dial, phone.number].filter((part) => part.trim().length > 0).join(' ');
      if (!number) {
        return '';
      }
      const kind = phoneKindLabel(phone.kind, labels);
      return kind ? `${kind}: ${number}` : number;
    })
    .filter((line) => line.length > 0);
}

/** Wert eines Adressfelds – aber nur, wenn das Feld für das gewählte Land überhaupt vorgesehen ist (Reste nach Länderwechsel werden ignoriert). */
function addressValue(address: PostalAddress, key: AddressValueKey): string {
  const visible = addressFields(address.country).some((field) => field.key === key);
  return visible ? address[key].trim() : '';
}

/** Komplette Postadresse in einer Zeile, kommagetrennt und in der landesüblichen Reihenfolge, mit Ländername am Ende. */
export function addressLine(address: PostalAddress, language: CvLanguage): string {
  const value = (key: AddressValueKey) => addressValue(address, key);
  let parts: string[];
  if (address.country === 'TR') {
    parts = [
      [value('neighborhood'), value('street'), value('houseNumber')].filter(Boolean).join(' '),
      value('apartment'),
      [value('district'), value('province')].filter(Boolean).join(' / '),
    ];
  } else if (address.country === 'DE' || address.country === 'AT' || address.country === 'CH') {
    parts = [[value('street'), value('houseNumber')].filter(Boolean).join(' '), [value('postalCode'), value('city')].filter(Boolean).join(' ')];
  } else if (address.country === 'JP') {
    parts = [value('postalCode'), [value('region'), value('city')].filter(Boolean).join(' '), [value('street'), value('houseNumber')].filter(Boolean).join(' ')];
  } else if (address.country === 'GB' || address.country === 'IE') {
    parts = [[value('houseNumber'), value('street')].filter(Boolean).join(' '), value('city'), value('postalCode')];
  } else if (addressFields(address.country).some((field) => field.key === 'region')) {
    // Länder mit Bundesstaat/Region (z. B. USA): 'Stadt, Region PLZ' wie im angelsächsischen Format.
    parts = [
      [value('houseNumber'), value('street')].filter(Boolean).join(' '),
      [value('city'), [value('region'), value('postalCode')].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    ];
  } else {
    parts = [[value('houseNumber'), value('street')].filter(Boolean).join(' '), [value('postalCode'), value('city')].filter(Boolean).join(' ')];
  }
  const country = countryName(address.country, language);
  return [...parts.map((part) => part.trim()).filter((part) => part.length > 0), country].filter((part) => part.length > 0).join(', ');
}

/** Welches Symbol eine Vorlage neben einem Kontakteintrag anzeigt. */
export type ContactIcon = 'email' | 'mobile' | 'home' | 'work' | 'fax' | 'phone' | 'address' | 'linkedin' | 'github' | 'website';

/** Ein Kontakt- oder Link-Eintrag, wie ihn die Vorlagen darstellen. */
export interface ContactEntry {
  icon: ContactIcon;
  /** Einzeilige Fassung (z. B. die Adresse kommagetrennt). */
  text: string;
  /** Mehrzeilige Fassung für Vorlagen, die Umbrüche zeigen; meist nur [text]. */
  lines: string[];
  /** Beschriftung, z. B. als Tooltip (title-Attribut) oder sichtbar neben dem Eintrag. */
  label: string;
}

function contactEntry(icon: ContactIcon, text: string, label: string, lines = [text]): ContactEntry {
  return { icon, text, lines, label };
}

/** Postadresse in bis zu drei Zeilen (Straße, Ort, Land) in landesüblicher Reihenfolge; leere Zeilen entfallen. */
export function addressLines(address: PostalAddress, language: CvLanguage): string[] {
  const value = (key: AddressValueKey) => addressValue(address, key);
  const country = countryName(address.country, language);
  let street: string;
  let locality: string;
  if (address.country === 'TR') {
    street = [value('neighborhood'), value('street'), value('houseNumber'), value('apartment')].filter(Boolean).join(' ');
    locality = [value('district'), value('province')].filter(Boolean).join(' / ');
  } else if (address.country === 'DE' || address.country === 'AT' || address.country === 'CH') {
    street = [value('street'), value('houseNumber')].filter(Boolean).join(' ');
    locality = [value('postalCode'), value('city')].filter(Boolean).join(' ');
  } else if (address.country === 'GB' || address.country === 'IE') {
    street = [value('houseNumber'), value('street')].filter(Boolean).join(' ');
    locality = [value('city'), value('postalCode')].filter(Boolean).join(' ');
  } else if (address.country === 'JP') {
    street = [value('street'), value('houseNumber')].filter(Boolean).join(' ');
    locality = [value('postalCode'), [value('region'), value('city')].filter(Boolean).join(' ')].filter(Boolean).join(' ');
  } else {
    street = [value('houseNumber'), value('street')].filter(Boolean).join(' ');
    locality = [[value('city'), value('region')].filter(Boolean).join(', '), value('postalCode')].filter(Boolean).join(' ');
  }
  return [street, locality, country].map((line) => line.trim()).filter((line) => line.length > 0);
}

/** Passendes Symbol zur Telefonart; ohne Art das allgemeine Telefonsymbol. */
function phoneIcon(kind: PhoneKind): ContactIcon {
  if (kind === 'mobile' || kind === 'home' || kind === 'work' || kind === 'fax') {
    return kind;
  }
  return 'phone';
}

/** Kontaktblock der Vorlagen: E-Mail, alle Telefonnummern und die Adresse – jeweils nur, wenn ausgefüllt. */
export function contactEntries(person: PersonalInfo, language: CvLanguage): ContactEntry[] {
  const labels = labelsFor(language);
  const entries: ContactEntry[] = [];
  if (person.email.trim()) {
    entries.push(contactEntry('email', person.email.trim(), labels.email));
  }
  for (const phone of person.phones) {
    const text = [phone.dial, phone.number].filter((part) => part.trim().length > 0).join(' ');
    if (!text) {
      continue;
    }
    const kind = phoneKindLabel(phone.kind, labels);
    entries.push(contactEntry(phoneIcon(phone.kind), text, kind || labels.phone));
  }
  const lines = addressLines(person.address, language);
  if (lines.length > 0) {
    entries.push(contactEntry('address', lines.join(', '), labels.address, lines));
  }
  return entries;
}

/** Link-Block der Vorlagen: LinkedIn, GitHub und Website, soweit angegeben (Beschriftungen sind sprachunabhängig). */
export function linkEntries(person: PersonalInfo): ContactEntry[] {
  const entries: ContactEntry[] = [];
  if (person.linkedIn.trim()) {
    entries.push(contactEntry('linkedin', person.linkedIn.trim(), 'LinkedIn'));
  }
  if (person.github.trim()) {
    entries.push(contactEntry('github', person.github.trim(), 'GitHub'));
  }
  if (person.website.trim()) {
    entries.push(contactEntry('website', person.website.trim(), 'Website'));
  }
  return entries;
}

/** Alle Kontaktangaben und Links als flache Textliste (Adresse einzeilig), leere Angaben entfallen. */
export function contactParts(person: PersonalInfo, language: CvLanguage): string[] {
  return [person.email, ...phoneLines(person, language), addressLine(person.address, language), person.linkedIn, person.github, person.website].filter(
    (part) => part.trim().length > 0,
  );
}

/** Persönliche Daten als Textzeilen wie 'Geburtsort: Berlin'; mehrere Werte werden mit ' · ' verbunden. */
export function personalFactLines(person: PersonalInfo, language: CvLanguage): string[] {
  return personalFactItems(person, language).map((item) =>
    item.details.length > 0 ? `${item.label}: ${item.details.join(' · ')}` : `${item.label}: ${item.value}`,
  );
}

/** Alle persönlichen Daten in einer einzigen, mit ' · ' getrennten Zeile. */
export function personalFacts(person: PersonalInfo, language: CvLanguage): string {
  return joinMeta(personalFactLines(person, language));
}

/** Arbeits- bzw. Ausbildungsort als 'Stadt, Land' (Land als ISO-Code übergeben); fehlende Teile entfallen. */
export function workplace(city: string, country: string, language: CvLanguage): string {
  return [city.trim(), countryName(country, language)].filter((part) => part.length > 0).join(', ');
}

/** Ausgeschriebene Seitenangabe ('Seite 1 von 2') je Sprache für den Stil 'label'. */
const PAGE_OF: Record<CvLanguage, (page: number, total: number) => string> = {
  de: (page, total) => `Seite ${page} von ${total}`,
  en: (page, total) => `Page ${page} of ${total}`,
  tr: (page, total) => `Sayfa ${page} / ${total}`,
};

/** Text der Seitenzahl im gewählten Stil (z. B. '1/2', '– 1 –', 'Seite 1 von 2'); leer, wenn Seitenzahlen ausgeschaltet sind. */
export function formatPageNumber(style: PageNumberStyle, page: number, total: number, language: CvLanguage): string {
  switch (style) {
    case 'off':
      return '';
    case 'fraction':
      return `${page}/${total}`;
    case 'dashed':
      return `– ${page} –`;
    case 'label':
      return PAGE_OF[language](page, total);
    case 'pill':
      return `${page} / ${total}`;
    case 'number':
    case 'badge':
      // 'badge' zeigt nur die Zahl; den Kreis drumherum zeichnet das CSS im Vorlagen-Host.
      return String(page);
  }
}

/** Verbindet die nicht-leeren Teile mit ' · ' zu einer Meta-Zeile, z. B. 'Firma · Berlin'. */
export function joinMeta(parts: string[]): string {
  return parts.map((part) => part.trim()).filter((part) => part.length > 0).join(' · ');
}

const RELATIVE_LOCALE: Record<CvLanguage, string> = { de: 'de-DE', en: 'en-GB', tr: 'tr-TR' };

/**
 * Kurze Zeitangabe „vor 5 Min.“, „vor 3 Std.“, „gestern“, „vor 4 Tagen“; ab einer Woche das Datum.
 * Leer bei ungültigem oder fehlendem Zeitpunkt.
 */
export function relativeTime(value: string, now: Date, language: CvLanguage): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return '';
  }
  const locale = RELATIVE_LOCALE[language];
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 1) {
    return format.format(0, 'second');
  }
  if (minutes < 60) {
    return format.format(-minutes, 'minute');
  }
  if (minutes < 24 * 60 && date.getDate() === now.getDate()) {
    return format.format(-Math.floor(minutes / 60), 'hour');
  }
  // Kalendertage, damit „gestern“ auch kurz nach Mitternacht stimmt.
  const startOf = (day: Date) => new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (days < 7) {
    return format.format(-days, 'day');
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

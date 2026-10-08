// Zentrales Datenmodell des Lebenslaufs: Typen, erlaubte Werte, Längengrenzen und leere Vorlagen.
// Wird von allen Teilen genutzt: Electron-Hauptprozess (Speichern/Laden, PDF), Preload und Angular-Oberfläche.

/** Aktuelle Version des gespeicherten Datenformats; Dateien mit höherer Version lehnt `migrate` ab. */
export const SCHEMA_VERSION = 1;

/**
 * Obergrenzen für Benutzereingaben, geprüft beim Einlesen in `migrate`.
 * Textfelder in Zeichen; `bullets` = Stichpunkte pro Eintrag, `items` = Einträge pro Liste, `id` = Länge einer ID.
 */
export const LIMITS = {
  shortText: 120,
  phone: 40,
  nationality: 80,
  email: 200,
  address: 300,
  url: 300,
  longText: 4000,
  bullet: 300,
  bullets: 20,
  items: 50,
  id: 80,
} as const;

/** Kennungen der drei Lebenslauf-Vorlagen (Klassisch, Modern, Minimal). */
export const TEMPLATE_IDS = ['classic', 'modern', 'minimal'] as const;
/** Kennung einer Lebenslauf-Vorlage. */
export type TemplateId = (typeof TEMPLATE_IDS)[number];
/** Sprache, in der der Lebenslauf (Überschriften, Datumsangaben, Kataloge) ausgegeben wird. */
export type CvLanguage = 'de' | 'en' | 'tr';
/** Auswählbare Geschlechtsangaben. */
export const GENDERS = ['female', 'male', 'diverse'] as const;
/** Geschlechtsangabe; `''` = keine Angabe. */
export type Gender = (typeof GENDERS)[number] | '';
/** Arten von Telefonnummern (Mobil, Privat, Geschäftlich, Fax). */
export const PHONE_KINDS = ['mobile', 'home', 'work', 'fax'] as const;
/** Art einer Telefonnummer; `''` = nicht angegeben. */
export type PhoneKind = (typeof PHONE_KINDS)[number] | '';
/** Sonderwert für `NationalityEntry.code`: Staatsangehörigkeit steht als freier Text in `custom`. */
export const OTHER_NATIONALITY = 'other';
/** Höchstzahl an Staatsangehörigkeiten pro Person. */
export const MAX_NATIONALITIES = 2;
/** Höchstzahl an Telefonnummern pro Person. */
export const MAX_PHONES = 5;

/** Standard-Akzentfarbe der Vorlagen (Hex, kleingeschrieben); Rückfallwert bei ungültigen Farben. */
export const DEFAULT_ACCENT = '#1f4b99';
/** Darstellung der Kenntnis-Stufen: Sterne oder Balken. */
export const SKILL_SCALES = ['stars', 'bars'] as const;
/** Darstellung der Kenntnis-Stufen. */
export type SkillScale = (typeof SKILL_SCALES)[number];
/** Position der Zeitangaben: `aside` = in eigener Spalte neben dem Eintrag, `below` = unter dem Titel. */
export const DATE_PLACES = ['aside', 'below'] as const;
/** Position der Zeitangaben eines Eintrags. */
export type DatePlace = (typeof DATE_PLACES)[number];
/** Zeitleiste neben Erfahrung/Ausbildung: `off` = keine, `line` = senkrechte Linie. */
export const TIMELINE_STYLES = ['off', 'line'] as const;
/** Stil der Zeitleiste. */
export type TimelineStyle = (typeof TIMELINE_STYLES)[number];
/** Gestaltungsvarianten der Seitenzahl im PDF; `off` = keine Seitenzahlen. */
export const PAGE_NUMBER_STYLES = ['off', 'fraction', 'number', 'dashed', 'label', 'badge', 'pill'] as const;
/** Gestaltungsvariante der Seitenzahl. */
export type PageNumberStyle = (typeof PAGE_NUMBER_STYLES)[number];
/** Horizontale Position der Seitenzahl in der Fußzeile. */
export const PAGE_NUMBER_PLACES = ['left', 'center', 'right'] as const;
/** Horizontale Position der Seitenzahl. */
export type PageNumberPlace = (typeof PAGE_NUMBER_PLACES)[number];
/** Interne Kennungen der wählbaren Schriftarten. */
export const CV_FONTS = ['sourceSans', 'sourceSerif', 'libreBaskerville', 'ibmPlex', 'lora', 'comicSans'] as const;
/** Kennung einer wählbaren Schriftart. */
export type CvFont = (typeof CV_FONTS)[number];

/** CSS-`font-family`-Werte je Schriftart, inklusive Ersatzschriften, falls die gewünschte fehlt. */
export const CV_FONT_STACKS: Record<CvFont, string> = {
  sourceSans: "'Source Sans 3', 'Segoe UI', sans-serif",
  sourceSerif: "'Source Serif 4', Palatino, 'Palatino Linotype', serif",
  libreBaskerville: "'Libre Baskerville', Palatino, 'Palatino Linotype', serif",
  ibmPlex: "'IBM Plex Sans', 'Segoe UI', sans-serif",
  lora: "'Lora', Georgia, serif",
  comicSans: "'Comic Sans MS', 'Comic Sans', 'Comic Neue', cursive",
};

/** Anzeigenamen der Schriftarten für die Auswahl in der Oberfläche. */
export const CV_FONT_LABELS: Record<CvFont, string> = {
  sourceSans: 'Source Sans',
  sourceSerif: 'Source Serif',
  libreBaskerville: 'Libre Baskerville',
  ibmPlex: 'IBM Plex Sans',
  lora: 'Lora',
  comicSans: 'Comic Sans MS',
};

/** Liefert den CSS-`font-family`-Wert für eine Schriftart. */
export function cvFontStack(font: CvFont): string {
  return CV_FONT_STACKS[font];
}

/** Eine Staatsangehörigkeit, entweder aus dem Länderkatalog oder als freier Text. */
export interface NationalityEntry {
  /** ISO-Ländercode (z. B. 'DE'), `OTHER_NATIONALITY` für freien Text oder `''` = nicht gewählt. */
  code: string;
  /** Freitext; nur gefüllt, wenn `code` gleich `OTHER_NATIONALITY` ist. */
  custom: string;
}

/** Eine Telefonnummer mit Ländervorwahl und Art. */
export interface PhoneEntry {
  id: string;
  /** ISO-Ländercode für die Vorwahl-Auswahl; `''` = kein Land aus dem Katalog. */
  country: string;
  /** Internationale Vorwahl wie '+49'; ergibt sich bei gesetztem `country` aus dem Länderkatalog. */
  dial: string;
  /** Rufnummer ohne Vorwahl. */
  number: string;
  kind: PhoneKind;
}

/**
 * Postanschrift; welche Felder angezeigt werden, hängt vom Land ab.
 * `neighborhood` (Mahalle), `district` (İlçe) und `province` (İl) dienen türkischen Adressen.
 */
export interface PostalAddress {
  /** ISO-Ländercode; `''` = nicht gewählt. */
  country: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  region: string;
  neighborhood: string;
  apartment: string;
  district: string;
  province: string;
}

/** Persönliche Angaben und Kontaktdaten im Kopf des Lebenslaufs. */
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phones: PhoneEntry[];
  address: PostalAddress;
  /** Geburtsdatum im Format 'YYYY-MM-DD'; `''` = keine Angabe. */
  birthDate: string;
  birthPlace: string;
  /** Mindestens ein (ggf. leerer) Eintrag, höchstens `MAX_NATIONALITIES`. */
  nationalities: NationalityEntry[];
  gender: Gender;
  linkedIn: string;
  github: string;
  website: string;
  /** Dateiname des gespeicherten Fotos ('<UUID>.png'); `''` = kein Foto. Das Bild selbst liegt getrennt von den Daten. */
  photoFile: string;
}

/** Eine Station der Berufserfahrung. */
export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  /** ISO-Ländercode des Arbeitsorts; `''` = nicht gewählt. */
  country: string;
  city: string;
  /** Beginn im Format 'YYYY-MM'; `''` = keine Angabe. */
  from: string;
  /** Ende im Format 'YYYY-MM'; `''` = keine Angabe. */
  until: string;
  /** `true` = Tätigkeit läuft noch („bis heute“), `until` wird dann nicht angezeigt. */
  current: boolean;
  description: string;
  bullets: string[];
}

/** Eine Station der Ausbildung (Schule, Studium, Weiterbildung). */
export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  /** Ort als freier Text. */
  location: string;
  /** Beginn im Format 'YYYY-MM'; `''` = keine Angabe. */
  from: string;
  /** Ende im Format 'YYYY-MM'; `''` = keine Angabe. */
  until: string;
  /** `true` = Ausbildung läuft noch, `until` wird dann nicht angezeigt. */
  current: boolean;
  description: string;
}

/** Eine Kenntnis aus dem Kenntnis-Katalog mit Bewertung. */
export interface SkillItem {
  /** Kennung aus dem Kenntnis-Katalog (z. B. 'typescript'); freie Namen gibt es nicht. */
  id: string;
  /** Stufe von 1 bis 5. */
  stars: number;
}

/** Eine Sprache aus dem Sprachkatalog mit Niveau. */
export interface LanguageItem {
  /** Kennung aus dem Sprachkatalog (z. B. 'de'). */
  id: string;
  /** Niveau-Kennung aus dem Katalog (z. B. 'b1', 'c2', 'native'); `''` = ohne Angabe. */
  level: string;
}

/** Ein Zertifikat oder eine Qualifikation. */
export interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  /** Ausstellungsdatum im Format 'YYYY-MM'; `''` = keine Angabe. */
  date: string;
  description: string;
}

/** Ein Projekt, z. B. Open Source oder Ehrenamt. */
export interface ProjectItem {
  id: string;
  name: string;
  url: string;
  /** Beginn im Format 'YYYY-MM'; `''` = keine Angabe. */
  from: string;
  /** Ende im Format 'YYYY-MM'; `''` = keine Angabe. */
  until: string;
  description: string;
  bullets: string[];
}

/** Gestaltungseinstellungen, die zusammen mit dem Lebenslauf gespeichert werden. */
export interface TemplateSettings {
  templateId: TemplateId;
  showPhoto: boolean;
  /** Hex-Farbe im Format '#rrggbb' (kleingeschrieben). */
  accentColor: string;
  /** Sprache des Lebenslaufs; bestimmt auch die Sprache von Datei-Dialogen und Dateinamen. */
  language: CvLanguage;
  skillScale: SkillScale;
  datePlace: DatePlace;
  timeline: TimelineStyle;
  font: CvFont;
  pageNumbers: PageNumberStyle;
  pageNumberPlace: PageNumberPlace;
}

/** Der komplette Lebenslauf, so wie er in cv-data.json bzw. IndexedDB gespeichert wird. */
export interface CvData {
  /** Version des Datenformats, siehe `SCHEMA_VERSION`. */
  schemaVersion: number;
  personal: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  certificates: CertificateItem[];
  projects: ProjectItem[];
  template: TemplateSettings;
}

/**
 * Darstellungsoptionen, die eine Vorlagen-Komponente zum Rendern bekommt (Vorschau und PDF).
 * Wie `TemplateSettings`, aber ohne Vorlagen-Kennung und zusätzlich mit dem geladenen Foto.
 */
export interface TemplateOptions {
  showPhoto: boolean;
  accentColor: string;
  language: CvLanguage;
  skillScale: SkillScale;
  datePlace: DatePlace;
  timeline: TimelineStyle;
  font: CvFont;
  pageNumbers: PageNumberStyle;
  pageNumberPlace: PageNumberPlace;
  /** Foto als Data-URL; `null`/fehlend = kein Foto. Wird nicht über IPC übertragen, sondern in der Druckansicht nachgeladen. */
  photoDataUrl?: string | null;
}

/** Erzeugt eine neue zufällige ID (UUID) für Listeneinträge. */
export function createId(): string {
  return globalThis.crypto.randomUUID();
}

/** Liefert eine Adresse, in der alle Felder leer sind. */
export function emptyAddress(): PostalAddress {
  return {
    country: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    region: '',
    neighborhood: '',
    apartment: '',
    district: '',
    province: '',
  };
}

/** Liefert leere persönliche Angaben mit einer leeren Staatsangehörigkeit als Eingabezeile. */
export function emptyPersonal(): PersonalInfo {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phones: [],
    address: emptyAddress(),
    birthDate: '',
    birthPlace: '',
    nationalities: [{ code: '', custom: '' }],
    gender: '',
    linkedIn: '',
    github: '',
    website: '',
    photoFile: '',
  };
}

/**
 * Liefert einen leeren Lebenslauf mit Standard-Design; Ausgangszustand, wenn noch keine Daten gespeichert sind.
 * Auch Grundlage für „Alle Daten löschen“ (dort bleibt das bisherige Design erhalten).
 */
export function emptyCv(): CvData {
  return {
    schemaVersion: SCHEMA_VERSION,
    personal: emptyPersonal(),
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certificates: [],
    projects: [],
    template: {
      templateId: 'classic',
      showPhoto: true,
      accentColor: DEFAULT_ACCENT,
      language: 'de',
      skillScale: 'stars',
      datePlace: 'aside',
      timeline: 'line',
      font: 'sourceSans',
      pageNumbers: 'fraction',
      pageNumberPlace: 'right',
    },
  };
}

// Beschriftungen, die im gedruckten Lebenslauf erscheinen (Abschnittstitel, Feldbezeichnungen), in de/en/tr.
// Die Texte der Bedienoberfläche stehen dagegen in ui-text.ts.
import type { CvLanguage, Gender, PhoneKind } from '../cv/cv-data';

/** Alle Lebenslauf-Beschriftungen je Sprache; alle drei Sprachblöcke müssen dieselben Schlüssel haben. */
export const SECTION_LABELS = {
  de: {
    // --- Abschnittstitel ---
    experience: 'Berufserfahrung',
    education: 'Ausbildung',
    skills: 'Kenntnisse',
    languages: 'Sprachen',
    certificates: 'Zertifikate',
    projects: 'Projekte',
    summary: 'Über mich',
    references: 'Referenzen',
    personal: 'Persönliche Daten',
    contact: 'Kontakt',
    links: 'Links',
    // --- Feldbezeichnungen und Werte ---
    present: 'heute',
    email: 'E-Mail',
    phone: 'Telefon',
    birthDate: 'Geburtsdatum',
    birthPlace: 'Geburtsort',
    nationality: 'Staatsangehörigkeit',
    gender: 'Geschlecht',
    genderFemale: 'Weiblich',
    genderMale: 'Männlich',
    genderDiverse: 'Divers',
    address: 'Adresse',
    phoneMobile: 'Handy',
    phoneHome: 'Haustelefon',
    phoneWork: 'Arbeit',
    phoneFax: 'Fax',
  },
  en: {
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    certificates: 'Certificates',
    projects: 'Projects',
    summary: 'About me',
    references: 'References',
    personal: 'Personal details',
    contact: 'Contact',
    links: 'Links',
    present: 'Present',
    email: 'Email',
    phone: 'Phone',
    birthDate: 'Date of birth',
    birthPlace: 'Place of birth',
    nationality: 'Nationality',
    gender: 'Gender',
    genderFemale: 'Female',
    genderMale: 'Male',
    genderDiverse: 'Diverse',
    address: 'Address',
    phoneMobile: 'Mobile',
    phoneHome: 'Home',
    phoneWork: 'Work',
    phoneFax: 'Fax',
  },
  tr: {
    experience: 'İş deneyimi',
    education: 'Eğitim',
    skills: 'Yetenekler',
    languages: 'Diller',
    certificates: 'Sertifikalar',
    projects: 'Projeler',
    summary: 'Hakkımda',
    references: 'Referanslar',
    personal: 'Kişisel bilgiler',
    contact: 'İletişim',
    links: 'Bağlantılar',
    present: 'günümüz',
    email: 'E-posta',
    phone: 'Telefon',
    birthDate: 'Doğum tarihi',
    birthPlace: 'Doğum yeri',
    nationality: 'Uyruk',
    gender: 'Cinsiyet',
    genderFemale: 'Kadın',
    genderMale: 'Erkek',
    genderDiverse: 'Diğer',
    address: 'Adres',
    phoneMobile: 'Cep telefonu',
    phoneHome: 'Ev telefonu',
    phoneWork: 'İş',
    phoneFax: 'Faks',
  },
} as const;

/** Typ der Beschriftungen einer Sprache (aus SECTION_LABELS abgeleitet). */
export type SectionLabels = (typeof SECTION_LABELS)[CvLanguage];

/** Beschriftungen für die gewählte Lebenslauf-Sprache. */
export function labelsFor(language: CvLanguage): SectionLabels {
  return SECTION_LABELS[language];
}

/** Bezeichnung der Telefonart, z. B. 'Handy'; leer, wenn keine Art gewählt ist. */
export function phoneKindLabel(kind: PhoneKind, labels: SectionLabels): string {
  if (kind === 'mobile') return labels.phoneMobile;
  if (kind === 'home') return labels.phoneHome;
  if (kind === 'work') return labels.phoneWork;
  if (kind === 'fax') return labels.phoneFax;
  return '';
}

/** Bezeichnung des Geschlechts; leer, wenn keine Angabe gemacht wurde (dann erscheint die Zeile nicht im Lebenslauf). */
export function genderLabel(gender: Gender, labels: SectionLabels): string {
  if (gender === 'female') {
    return labels.genderFemale;
  }
  if (gender === 'male') {
    return labels.genderMale;
  }
  if (gender === 'diverse') {
    return labels.genderDiverse;
  }
  return '';
}

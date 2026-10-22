// Reactive Form des Editors: typisierte Control-Strukturen, Fabriken für alle Einträge,
// Aufbau des Formulars aus CvData (createCvForm) und Rückwandlung in CvData (formToCvData).
// Längenbegrenzungen kommen aus LIMITS, damit Formular und Datenprüfung übereinstimmen.
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  LIMITS,
  createId,
  emptyAddress,
  type CertificateItem,
  type CvData,
  type CvFont,
  type CvLanguage,
  type DatePlace,
  type EducationItem,
  type Gender,
  type ExperienceItem,
  type LanguageItem,
  type NationalityEntry,
  type PageNumberPlace,
  type PageNumberStyle,
  type PhoneEntry,
  type PhoneKind,
  type PostalAddress,
  type ProjectItem,
  type ReferenceItem,
  type EntryOrder,
  type SkillItem,
  type SkillScale,
  type TimelineStyle,
  type TemplateId,
} from '@shared/cv/cv-data';

/** Textfeld mit Höchstlänge; nonNullable, damit reset() auf den Startwert statt auf null zurückfällt. */
function textControl(value: string, max: number): FormControl<string> {
  return new FormControl(value, { nonNullable: true, validators: [Validators.maxLength(max)] });
}

/** Ja/Nein-Feld (Checkbox). */
function boolControl(value: boolean): FormControl<boolean> {
  return new FormControl(value, { nonNullable: true });
}

/** Monatsfeld im Format JJJJ-MM; optional gesperrt (z. B. Enddatum bei „aktuell“). */
function monthControl(value: string, disabled = false): FormControl<string> {
  return new FormControl({ value, disabled }, { nonNullable: true });
}

/** Controls einer Staatsangehörigkeit: Ländercode oder „Andere“ plus Freitext. */
export interface NationalityControls {
  code: FormControl<string>;
  custom: FormControl<string>;
}

/** Controls einer Telefonnummer: Vorwahl-Land, Vorwahl, Nummer, Art. */
export interface PhoneControls {
  id: FormControl<string>;
  country: FormControl<string>;
  dial: FormControl<string>;
  number: FormControl<string>;
  kind: FormControl<PhoneKind>;
}

/** Controls der Postanschrift; welche Felder sichtbar sind, hängt vom Land ab. */
export interface AddressControls {
  country: FormControl<string>;
  street: FormControl<string>;
  houseNumber: FormControl<string>;
  postalCode: FormControl<string>;
  city: FormControl<string>;
  region: FormControl<string>;
  neighborhood: FormControl<string>;
  apartment: FormControl<string>;
  district: FormControl<string>;
  province: FormControl<string>;
}

/** Controls der persönlichen Daten (inkl. Telefone, Adresse, Staatsangehörigkeiten, Foto-Dateiname). */
export interface PersonalControls {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  phones: FormArray<FormGroup<PhoneControls>>;
  address: FormGroup<AddressControls>;
  birthDate: FormControl<string>;
  birthPlace: FormControl<string>;
  nationalities: FormArray<FormGroup<NationalityControls>>;
  gender: FormControl<Gender>;
  linkedIn: FormControl<string>;
  github: FormControl<string>;
  website: FormControl<string>;
  photoFile: FormControl<string>;
}

/** Controls einer Berufsstation. */
export interface ExperienceControls {
  id: FormControl<string>;
  company: FormControl<string>;
  position: FormControl<string>;
  country: FormControl<string>;
  city: FormControl<string>;
  from: FormControl<string>;
  until: FormControl<string>;
  current: FormControl<boolean>;
  description: FormControl<string>;
  bullets: FormArray<FormControl<string>>;
}

/** Controls einer Ausbildung. */
export interface EducationControls {
  id: FormControl<string>;
  institution: FormControl<string>;
  degree: FormControl<string>;
  location: FormControl<string>;
  from: FormControl<string>;
  until: FormControl<string>;
  current: FormControl<boolean>;
  description: FormControl<string>;
}

/** Controls einer Kenntnis: Katalog-id und Stufe. */
export interface SkillControls {
  id: FormControl<string>;
  stars: FormControl<number>;
}

/** Controls einer Sprache: Katalog-id und Niveau. */
export interface LanguageControls {
  id: FormControl<string>;
  level: FormControl<string>;
}

/** Controls eines Zertifikats. */
export interface CertificateControls {
  id: FormControl<string>;
  name: FormControl<string>;
  issuer: FormControl<string>;
  date: FormControl<string>;
  description: FormControl<string>;
}

/** Controls eines Projekts. */
export interface ProjectControls {
  id: FormControl<string>;
  name: FormControl<string>;
  url: FormControl<string>;
  from: FormControl<string>;
  until: FormControl<string>;
  description: FormControl<string>;
  bullets: FormArray<FormControl<string>>;
}

/** Controls einer Referenz. */
export interface ReferenceControls {
  id: FormControl<string>;
  name: FormControl<string>;
  position: FormControl<string>;
  company: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
}

/** FormGroup einer Berufsstation (Kurzname für die Abschnitts-Komponenten). */
export type ExperienceGroup = FormGroup<ExperienceControls>;
/** FormGroup einer Ausbildung. */
export type EducationGroup = FormGroup<EducationControls>;
/** FormGroup einer Kenntnis. */
export type SkillGroup = FormGroup<SkillControls>;
/** FormGroup einer Sprache. */
export type LanguageGroup = FormGroup<LanguageControls>;
/** FormGroup eines Zertifikats. */
export type CertificateGroup = FormGroup<CertificateControls>;
/** FormGroup eines Projekts. */
export type ProjectGroup = FormGroup<ProjectControls>;
/** FormGroup einer Referenz. */
export type ReferenceGroup = FormGroup<ReferenceControls>;

/** Gesamtstruktur des Formulars: Inhalte plus die Design-Einstellungen (flach statt unter `template`). */
export interface CvFormControls {
  personal: FormGroup<PersonalControls>;
  summary: FormControl<string>;
  experience: FormArray<ExperienceGroup>;
  education: FormArray<EducationGroup>;
  skills: FormArray<SkillGroup>;
  languages: FormArray<LanguageGroup>;
  certificates: FormArray<CertificateGroup>;
  projects: FormArray<ProjectGroup>;
  references: FormArray<ReferenceGroup>;
  templateId: FormControl<TemplateId>;
  showPhoto: FormControl<boolean>;
  showGender: FormControl<boolean>;
  accentColor: FormControl<string>;
  language: FormControl<CvLanguage>;
  skillScale: FormControl<SkillScale>;
  datePlace: FormControl<DatePlace>;
  timeline: FormControl<TimelineStyle>;
  entryOrder: FormControl<EntryOrder>;
  font: FormControl<CvFont>;
  pageNumbers: FormControl<PageNumberStyle>;
  pageNumberPlace: FormControl<PageNumberPlace>;
}

/** Das komplette Lebenslauf-Formular. */
export type CvForm = FormGroup<CvFormControls>;
/** Vollständiger Formularwert inkl. gesperrter Felder (getRawValue). */
export type CvFormValue = ReturnType<CvForm['getRawValue']>;

/** Ein Stichpunkt-Feld mit der Höchstlänge für Stichpunkte. */
export function bulletControl(value = ''): FormControl<string> {
  return textControl(value, LIMITS.bullet);
}

/** Berufsstation; ohne Vorlage leer mit neuer id. Bei „aktuell“ startet das Enddatum gesperrt. */
export function createExperienceGroup(item?: Partial<ExperienceItem>): ExperienceGroup {
  return new FormGroup({
    id: textControl(item?.id || createId(), LIMITS.id),
    company: textControl(item?.company ?? '', LIMITS.shortText),
    position: textControl(item?.position ?? '', LIMITS.shortText),
    country: textControl(item?.country ?? '', 2),
    city: textControl(item?.city ?? '', LIMITS.shortText),
    from: monthControl(item?.from ?? ''),
    until: monthControl(item?.until ?? '', item?.current ?? false),
    current: boolControl(item?.current ?? false),
    description: textControl(item?.description ?? '', LIMITS.longText),
    bullets: new FormArray((item?.bullets ?? []).map((bullet) => bulletControl(bullet))),
  });
}

/** Ausbildung; ohne Vorlage leer mit neuer id. Bei „aktuell“ startet das Enddatum gesperrt. */
export function createEducationGroup(item?: Partial<EducationItem>): EducationGroup {
  return new FormGroup({
    id: textControl(item?.id || createId(), LIMITS.id),
    institution: textControl(item?.institution ?? '', LIMITS.shortText),
    degree: textControl(item?.degree ?? '', LIMITS.shortText),
    location: textControl(item?.location ?? '', LIMITS.shortText),
    from: monthControl(item?.from ?? ''),
    until: monthControl(item?.until ?? '', item?.current ?? false),
    current: boolControl(item?.current ?? false),
    description: textControl(item?.description ?? '', LIMITS.longText),
  });
}

/** Kenntnis; die id ist eine Katalog-Kennung (keine neue id). Ungültige Stufen werden zu 0. */
export function createSkillGroup(item?: Partial<SkillItem>): SkillGroup {
  const stars = item?.stars ?? 0;
  return new FormGroup({
    id: textControl(item?.id ?? '', LIMITS.id),
    stars: new FormControl(stars >= 1 && stars <= 5 ? stars : 0, { nonNullable: true }),
  });
}

/** Sprache mit Katalog-id und Niveau-Kennung. */
export function createLanguageGroup(item?: Partial<LanguageItem>): LanguageGroup {
  return new FormGroup({
    id: textControl(item?.id ?? '', LIMITS.id),
    level: textControl(item?.level ?? '', LIMITS.id),
  });
}

/** Zertifikat; ohne Vorlage leer mit neuer id. */
export function createCertificateGroup(item?: Partial<CertificateItem>): CertificateGroup {
  return new FormGroup({
    id: textControl(item?.id || createId(), LIMITS.id),
    name: textControl(item?.name ?? '', LIMITS.shortText),
    issuer: textControl(item?.issuer ?? '', LIMITS.shortText),
    date: monthControl(item?.date ?? ''),
    description: textControl(item?.description ?? '', LIMITS.longText),
  });
}

/** Projekt; ohne Vorlage leer mit neuer id. */
export function createProjectGroup(item?: Partial<ProjectItem>): ProjectGroup {
  return new FormGroup({
    id: textControl(item?.id || createId(), LIMITS.id),
    name: textControl(item?.name ?? '', LIMITS.shortText),
    url: textControl(item?.url ?? '', LIMITS.url),
    from: monthControl(item?.from ?? ''),
    until: monthControl(item?.until ?? ''),
    description: textControl(item?.description ?? '', LIMITS.longText),
    bullets: new FormArray((item?.bullets ?? []).map((bullet) => bulletControl(bullet))),
  });
}

/** Referenz; ohne Vorlage leer mit neuer id. */
export function createReferenceGroup(item?: Partial<ReferenceItem>): ReferenceGroup {
  return new FormGroup({
    id: textControl(item?.id || createId(), LIMITS.id),
    name: textControl(item?.name ?? '', LIMITS.shortText),
    position: textControl(item?.position ?? '', LIMITS.shortText),
    company: textControl(item?.company ?? '', LIMITS.shortText),
    email: textControl(item?.email ?? '', LIMITS.email),
    phone: textControl(item?.phone ?? '', LIMITS.phone),
  });
}

/** Staatsangehörigkeit (Ländercode bzw. „Andere“ mit Freitext). */
export function createNationalityGroup(item?: Partial<NationalityEntry>): FormGroup<NationalityControls> {
  return new FormGroup({
    code: textControl(item?.code ?? '', 8),
    custom: textControl(item?.custom ?? '', LIMITS.nationality),
  });
}

/** Telefonnummer; ohne Vorlage leer mit neuer id. */
export function createPhoneGroup(item?: Partial<PhoneEntry>): FormGroup<PhoneControls> {
  return new FormGroup({
    id: textControl(item?.id || createId(), LIMITS.id),
    country: textControl(item?.country ?? '', 2),
    dial: textControl(item?.dial ?? '', 8),
    number: textControl(item?.number ?? '', LIMITS.phone),
    kind: new FormControl<PhoneKind>(item?.kind ?? '', { nonNullable: true }),
  });
}

/** Postanschrift; fehlende Felder werden mit leeren Werten aufgefüllt. */
export function createAddressGroup(item?: Partial<PostalAddress>): FormGroup<AddressControls> {
  const address = { ...emptyAddress(), ...item };
  return new FormGroup({
    country: textControl(address.country, 2),
    street: textControl(address.street, LIMITS.address),
    houseNumber: textControl(address.houseNumber, LIMITS.shortText),
    postalCode: textControl(address.postalCode, LIMITS.shortText),
    city: textControl(address.city, LIMITS.shortText),
    region: textControl(address.region, LIMITS.shortText),
    neighborhood: textControl(address.neighborhood, LIMITS.shortText),
    apartment: textControl(address.apartment, LIMITS.shortText),
    district: textControl(address.district, LIMITS.shortText),
    province: textControl(address.province, LIMITS.shortText),
  });
}

/** Baut das komplette Formular aus den Lebenslauf-Daten. */
export function createCvForm(data: CvData): CvForm {
  const person = data.personal;
  return new FormGroup({
    personal: new FormGroup({
      firstName: textControl(person.firstName, LIMITS.shortText),
      lastName: textControl(person.lastName, LIMITS.shortText),
      email: textControl(person.email, LIMITS.email),
      // Mindestens eine (leere) Telefonzeile und eine Staatsangehörigkeit, damit immer ein Eingabefeld sichtbar ist.
      phones: new FormArray(
        (person.phones.length > 0 ? person.phones : [{ id: createId(), country: '', dial: '', number: '', kind: '' as const }]).map((phone) =>
          createPhoneGroup(phone),
        ),
      ),
      address: createAddressGroup(person.address),
      birthDate: textControl(person.birthDate, 10),
      birthPlace: textControl(person.birthPlace, LIMITS.shortText),
      nationalities: new FormArray(
        (person.nationalities.length > 0 ? person.nationalities : [{ code: '', custom: '' }]).map((entry) => createNationalityGroup(entry)),
      ),
      gender: new FormControl(person.gender, { nonNullable: true }),
      linkedIn: textControl(person.linkedIn, LIMITS.url),
      github: textControl(person.github, LIMITS.url),
      website: textControl(person.website, LIMITS.url),
      photoFile: textControl(person.photoFile, 80),
    }),
    summary: textControl(data.summary, LIMITS.longText),
    experience: new FormArray(data.experience.map((item) => createExperienceGroup(item))),
    education: new FormArray(data.education.map((item) => createEducationGroup(item))),
    skills: new FormArray(data.skills.map((item) => createSkillGroup(item))),
    languages: new FormArray(data.languages.map((item) => createLanguageGroup(item))),
    certificates: new FormArray(data.certificates.map((item) => createCertificateGroup(item))),
    projects: new FormArray(data.projects.map((item) => createProjectGroup(item))),
    references: new FormArray(data.references.map((item) => createReferenceGroup(item))),
    templateId: new FormControl(data.template.templateId, { nonNullable: true }),
    showPhoto: boolControl(data.template.showPhoto),
    showGender: boolControl(data.template.showGender),
    accentColor: textControl(data.template.accentColor, 7),
    language: new FormControl(data.template.language, { nonNullable: true }),
    skillScale: new FormControl(data.template.skillScale, { nonNullable: true }),
    datePlace: new FormControl(data.template.datePlace, { nonNullable: true }),
    timeline: new FormControl(data.template.timeline, { nonNullable: true }),
    entryOrder: new FormControl(data.template.entryOrder, { nonNullable: true }),
    font: new FormControl(data.template.font, { nonNullable: true }),
    pageNumbers: new FormControl(data.template.pageNumbers, { nonNullable: true }),
    pageNumberPlace: new FormControl(data.template.pageNumberPlace, { nonNullable: true }),
  });
}

/**
 * Wandelt den Formularwert zurück in CvData: Design-Felder wandern nach `template`,
 * Listen und Stichpunkte werden kopiert, damit keine Referenzen auf den Formularwert bleiben.
 */
export function formToCvData(value: CvFormValue): CvData {
  return {
    schemaVersion: 1,
    personal: { ...value.personal },
    summary: value.summary,
    experience: value.experience.map((item) => ({ ...item, bullets: [...item.bullets] })),
    education: value.education.map((item) => ({ ...item })),
    skills: value.skills.map((item) => ({ ...item })),
    languages: value.languages.map((item) => ({ ...item })),
    certificates: value.certificates.map((item) => ({ ...item })),
    projects: value.projects.map((item) => ({ ...item, bullets: [...item.bullets] })),
    references: value.references.map((item) => ({ ...item })),
    template: {
      templateId: value.templateId,
      showPhoto: value.showPhoto,
      showGender: value.showGender,
      accentColor: value.accentColor,
      language: value.language,
      skillScale: value.skillScale,
      datePlace: value.datePlace,
      timeline: value.timeline,
      entryOrder: value.entryOrder,
      font: value.font,
      pageNumbers: value.pageNumbers,
      pageNumberPlace: value.pageNumberPlace,
    },
  };
}

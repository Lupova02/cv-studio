// Vollständigkeits- und Qualitätscheck: findet fehlende Angaben, unstimmige Zeiträume und zu lange Texte
// und formuliert dazu Hinweise in der Sprache des Lebenslaufs. Nichts davon ist Pflicht; der Editor zeigt die Hinweise nur an.
import { languageCatalog } from '../catalogs/language-catalog';
import { labelsFor } from '../i18n/labels';
import { uiText } from '../i18n/ui-text';
import type { CvData } from './cv-data';

/** Empfohlene Höchstlängen (Zeichen), ab denen ein Text als lang gilt. */
export const QUALITY_LIMITS = {
  summary: 600,
  description: 700,
  bullet: 180,
  pages: 2,
} as const;

/** Abschnitt, zu dem ein Hinweis gehört (zum Hinspringen im Editor). */
export type QualitySection =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certificates'
  | 'projects'
  | 'layout';

/** Ein Hinweis: `warning` = sollte man beheben, `info` = Empfehlung. */
export interface QualityHint {
  /** Stabile Kennung, z. B. für `track` in Listen. */
  id: string;
  level: 'warning' | 'info';
  section: QualitySection;
  text: string;
}

/** Zusatzangaben, die nicht in den Daten stehen. */
export interface QualityContext {
  /** Seitenzahl laut Vorschau; ohne Angabe wird die Länge nicht bewertet. */
  pages?: number;
  /** Ob die gewählte Vorlage ein Foto zeigt. */
  photoShown?: boolean;
  /** Heutiges Datum (für Tests austauschbar). */
  today?: Date;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Ersetzt `{name}`-Platzhalter in einem Text. */
function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Aktueller Monat als 'YYYY-MM'. */
function monthOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Ein datierter Listeneintrag in vereinheitlichter Form. */
interface DatedEntry {
  title: string;
  from: string;
  until: string;
  current: boolean;
  description: string;
  bullets: string[];
}

/** Prüft die Daten und liefert Hinweise, wichtigste (Warnungen) zuerst. */
export function checkCv(data: CvData, context: QualityContext = {}): QualityHint[] {
  const language = data.template.language;
  const ui = uiText(language);
  const labels = labelsFor(language);
  const today = monthOf(context.today ?? new Date());
  const hints: QualityHint[] = [];
  const add = (id: string, level: QualityHint['level'], section: QualitySection, text: string) => hints.push({ id, level, section, text });

  // --- Persönliches ---
  const person = data.personal;
  if (!person.firstName.trim() || !person.lastName.trim()) {
    add('name', 'warning', 'personal', ui.qMissingName);
  }
  if (!person.email.trim()) {
    add('email', 'warning', 'personal', ui.qMissingEmail);
  } else if (!EMAIL.test(person.email.trim())) {
    add('email-invalid', 'warning', 'personal', ui.qInvalidEmail);
  }
  if (!person.phones.some((phone) => phone.number.trim())) {
    add('phone', 'info', 'personal', ui.qMissingPhone);
  }
  if (context.photoShown && !person.photoFile) {
    add('photo', 'info', 'personal', ui.qMissingPhoto);
  }

  // --- Über mich ---
  const summary = data.summary.trim();
  if (!summary) {
    add('summary', 'info', 'summary', ui.qMissingSummary);
  } else if (summary.length > QUALITY_LIMITS.summary) {
    add('summary-long', 'warning', 'summary', fill(ui.qLongSummary, { count: summary.length, max: QUALITY_LIMITS.summary }));
  }

  // --- Datierte Einträge ---
  const checkEntries = (section: QualitySection, sectionLabel: string, entries: DatedEntry[], needsDates: boolean) => {
    entries.forEach((entry, index) => {
      const entryLabel = entry.title ? `${sectionLabel} „${entry.title}“` : `${sectionLabel} ${index + 1}`;
      const key = `${section}-${index}`;
      if (!entry.title) {
        add(`${key}-title`, 'warning', section, fill(ui.qEntryTitle, { entry: entryLabel }));
      }
      if (needsDates && !entry.from) {
        add(`${key}-dates`, 'info', section, fill(ui.qEntryDates, { entry: entryLabel }));
      }
      if (entry.from && entry.until && !entry.current && entry.until < entry.from) {
        add(`${key}-order`, 'warning', section, fill(ui.qEntryOrder, { entry: entryLabel }));
      }
      if (entry.from && entry.from > today) {
        add(`${key}-future`, 'info', section, fill(ui.qEntryFuture, { entry: entryLabel }));
      }
      const description = entry.description.trim();
      if (description.length > QUALITY_LIMITS.description) {
        add(`${key}-long`, 'info', section, fill(ui.qEntryLong, { entry: entryLabel, count: description.length }));
      }
      entry.bullets.forEach((bullet, bulletIndex) => {
        const text = bullet.trim();
        if (!text) {
          add(`${key}-bullet-${bulletIndex}-empty`, 'info', section, fill(ui.qBulletEmpty, { entry: entryLabel, bullet: bulletIndex + 1 }));
        } else if (text.length > QUALITY_LIMITS.bullet) {
          add(
            `${key}-bullet-${bulletIndex}-long`,
            'info',
            section,
            fill(ui.qBulletLong, { entry: entryLabel, bullet: bulletIndex + 1, count: text.length }),
          );
        }
      });
    });
  };

  if (data.experience.length === 0) {
    add('experience', 'info', 'experience', ui.qNoExperience);
  }
  checkEntries(
    'experience',
    labels.experience,
    data.experience.map((item) => ({ ...item, title: (item.position || item.company).trim() })),
    true,
  );
  if (data.education.length === 0) {
    add('education', 'info', 'education', ui.qNoEducation);
  }
  checkEntries(
    'education',
    labels.education,
    data.education.map((item) => ({ ...item, title: (item.degree || item.institution).trim(), bullets: [] })),
    true,
  );
  checkEntries(
    'certificates',
    labels.certificates,
    data.certificates.map((item) => ({ title: item.name.trim(), from: item.date, until: '', current: false, description: item.description, bullets: [] })),
    false,
  );
  checkEntries(
    'projects',
    labels.projects,
    data.projects.map((item) => ({ ...item, title: item.name.trim(), current: false })),
    false,
  );

  // --- Kenntnisse und Sprachen ---
  if (data.skills.length === 0) {
    add('skills', 'info', 'skills', ui.qNoSkills);
  }
  if (data.languages.length === 0) {
    add('languages', 'info', 'languages', ui.qNoLanguages);
  }
  const names = new Map(languageCatalog(language).map((item) => [item.id, item.name]));
  for (const item of data.languages) {
    if (!item.level) {
      add(`language-${item.id}`, 'info', 'languages', fill(ui.qLanguageLevel, { name: names.get(item.id) ?? item.id }));
    }
  }

  // --- Umfang ---
  if (context.pages !== undefined && context.pages > QUALITY_LIMITS.pages) {
    add('pages', 'warning', 'layout', fill(ui.qPages, { pages: context.pages }));
  }

  // Warnungen zuerst, sonst Reihenfolge des Lebenslaufs.
  return hints.sort((a, b) => (a.level === b.level ? 0 : a.level === 'warning' ? -1 : 1));
}

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

/**
 * Feld, zu dem ein Hinweis im Editor springt: `field` ist der formControlName, `entry` der Eintrag
 * (Zahl = Position in der Liste, Text = Kennung, z. B. der Sprache) und `bullet` der Stichpunkt.
 */
export interface QualityTarget {
  field: string;
  entry?: number | string;
  bullet?: number;
}

/** Ein Hinweis: `warning` = sollte man beheben, `info` = Empfehlung. */
export interface QualityHint {
  /** Stabile Kennung, z. B. für `track` in Listen. */
  id: string;
  level: 'warning' | 'info';
  section: QualitySection;
  text: string;
  /** Betroffenes Feld; ohne Angabe springt der Editor nur zum Abschnitt. */
  target?: QualityTarget;
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
  /** Feldnamen im Editor für Titel, Beginn und Ende. */
  titleField: string;
  fromField: string;
  untilField: string;
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
  const add = (id: string, level: QualityHint['level'], section: QualitySection, text: string, target?: QualityTarget) =>
    hints.push(target ? { id, level, section, text, target } : { id, level, section, text });

  // --- Persönliches ---
  const person = data.personal;
  if (!person.firstName.trim() || !person.lastName.trim()) {
    add('name', 'warning', 'personal', ui.qMissingName, { field: person.firstName.trim() ? 'lastName' : 'firstName' });
  }
  if (!person.email.trim()) {
    add('email', 'warning', 'personal', ui.qMissingEmail, { field: 'email' });
  } else if (!EMAIL.test(person.email.trim())) {
    add('email-invalid', 'warning', 'personal', ui.qInvalidEmail, { field: 'email' });
  }
  if (!person.phones.some((phone) => phone.number.trim())) {
    add('phone', 'info', 'personal', ui.qMissingPhone, { field: 'number' });
  }
  if (context.photoShown && !person.photoFile) {
    add('photo', 'info', 'personal', ui.qMissingPhoto, { field: 'photo' });
  }

  // --- Über mich ---
  const summary = data.summary.trim();
  if (!summary) {
    add('summary', 'info', 'summary', ui.qMissingSummary, { field: 'summary' });
  } else if (summary.length > QUALITY_LIMITS.summary) {
    add('summary-long', 'warning', 'summary', fill(ui.qLongSummary, { count: summary.length, max: QUALITY_LIMITS.summary }), {
      field: 'summary',
    });
  }

  // --- Datierte Einträge ---
  const checkEntries = (section: QualitySection, sectionLabel: string, entries: DatedEntry[], needsDates: boolean) => {
    entries.forEach((entry, index) => {
      const entryLabel = entry.title ? `${sectionLabel} „${entry.title}“` : `${sectionLabel} ${index + 1}`;
      const key = `${section}-${index}`;
      const at = (field: string, bullet?: number): QualityTarget => (bullet === undefined ? { field, entry: index } : { field, entry: index, bullet });
      if (!entry.title) {
        add(`${key}-title`, 'warning', section, fill(ui.qEntryTitle, { entry: entryLabel }), at(entry.titleField));
      }
      if (needsDates && !entry.from) {
        add(`${key}-dates`, 'info', section, fill(ui.qEntryDates, { entry: entryLabel }), at(entry.fromField));
      }
      if (entry.from && entry.until && !entry.current && entry.until < entry.from) {
        add(`${key}-order`, 'warning', section, fill(ui.qEntryOrder, { entry: entryLabel }), at(entry.untilField));
      }
      if (entry.from && entry.from > today) {
        add(`${key}-future`, 'info', section, fill(ui.qEntryFuture, { entry: entryLabel }), at(entry.fromField));
      }
      const description = entry.description.trim();
      if (description.length > QUALITY_LIMITS.description) {
        add(`${key}-long`, 'info', section, fill(ui.qEntryLong, { entry: entryLabel, count: description.length }), at('description'));
      }
      entry.bullets.forEach((bullet, bulletIndex) => {
        const text = bullet.trim();
        if (!text) {
          add(
            `${key}-bullet-${bulletIndex}-empty`,
            'info',
            section,
            fill(ui.qBulletEmpty, { entry: entryLabel, bullet: bulletIndex + 1 }),
            at('bullets', bulletIndex),
          );
        } else if (text.length > QUALITY_LIMITS.bullet) {
          add(
            `${key}-bullet-${bulletIndex}-long`,
            'info',
            section,
            fill(ui.qBulletLong, { entry: entryLabel, bullet: bulletIndex + 1, count: text.length }),
            at('bullets', bulletIndex),
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
    data.experience.map((item) => ({ ...item, title: (item.position || item.company).trim(), titleField: 'position', fromField: 'from', untilField: 'until' })),
    true,
  );
  if (data.education.length === 0) {
    add('education', 'info', 'education', ui.qNoEducation);
  }
  checkEntries(
    'education',
    labels.education,
    data.education.map((item) => ({
      ...item,
      title: (item.degree || item.institution).trim(),
      titleField: 'degree',
      fromField: 'from',
      untilField: 'until',
      bullets: [],
    })),
    true,
  );
  checkEntries(
    'certificates',
    labels.certificates,
    data.certificates.map((item) => ({
      title: item.name.trim(),
      titleField: 'name',
      from: item.date,
      fromField: 'date',
      until: '',
      untilField: 'date',
      current: false,
      description: item.description,
      bullets: [],
    })),
    false,
  );
  checkEntries(
    'projects',
    labels.projects,
    data.projects.map((item) => ({ ...item, title: item.name.trim(), titleField: 'name', fromField: 'from', untilField: 'until', current: false })),
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
      add(`language-${item.id}`, 'info', 'languages', fill(ui.qLanguageLevel, { name: names.get(item.id) ?? item.id }), {
        field: 'level',
        entry: item.id,
      });
    }
  }

  // --- Umfang ---
  if (context.pages !== undefined && context.pages > QUALITY_LIMITS.pages) {
    add('pages', 'warning', 'layout', fill(ui.qPages, { pages: context.pages }));
  }

  // Warnungen zuerst, sonst Reihenfolge des Lebenslaufs.
  return hints.sort((a, b) => (a.level === b.level ? 0 : a.level === 'warning' ? -1 : 1));
}

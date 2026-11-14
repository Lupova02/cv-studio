// Ausfüllstand je Editor-Abschnitt für die Schnellnavigation: leer, angefangen oder fertig.
import type { CvData } from './cv-data';

/** Abschnitte in der Reihenfolge des Editors. */
export const PROGRESS_SECTIONS = ['personal', 'summary', 'languages', 'skills', 'experience', 'education', 'certificates', 'projects', 'references'] as const;
export type ProgressSection = (typeof PROGRESS_SECTIONS)[number];
export type SectionState = 'empty' | 'partial' | 'done';

/** Leer, wenn nichts zutrifft; fertig, wenn alles zutrifft; sonst angefangen. */
function stateOf(checks: boolean[]): SectionState {
  const filled = checks.filter(Boolean).length;
  return filled === 0 ? 'empty' : filled === checks.length ? 'done' : 'partial';
}

/** Listen: leer ohne Einträge, fertig, wenn jeder Eintrag seine Hauptangabe hat, sonst angefangen. */
function listState<T>(items: readonly T[], complete: (item: T) => boolean): SectionState {
  return items.length === 0 ? 'empty' : items.every(complete) ? 'done' : 'partial';
}

const has = (value: string) => value.trim().length > 0;

/** Ausfüllstand aller Abschnitte. Persönliches zählt Name, E-Mail, Telefon und Wohnort. */
export function sectionProgress(data: CvData): Record<ProgressSection, SectionState> {
  const person = data.personal;
  return {
    personal: stateOf([
      has(person.firstName) && has(person.lastName),
      has(person.email),
      person.phones.some((phone) => has(phone.number)),
      has(person.address.city) || has(person.address.country),
    ]),
    summary: has(data.summary) ? 'done' : 'empty',
    languages: listState(data.languages, (item) => has(item.level)),
    skills: data.skills.length > 0 ? 'done' : 'empty',
    experience: listState(data.experience, (item) => has(item.position || item.company) && has(item.from)),
    education: listState(data.education, (item) => has(item.degree || item.institution) && has(item.from)),
    certificates: listState(data.certificates, (item) => has(item.name)),
    projects: listState(data.projects, (item) => has(item.name)),
    references: listState(data.references, (item) => has(item.name)),
  };
}

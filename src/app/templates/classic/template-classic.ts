import { Component, computed, input } from '@angular/core';
import type { CvData, TemplateOptions } from '@shared/cv/cv-data';
import { contactEntries, formatRange, joinMeta, linkEntries, personalFactItems, workplace } from '@shared/format/format';
import { labelsFor } from '@shared/i18n/labels';
import { languageEntries } from '@shared/catalogs/language-catalog';
import { groupedSkills } from '@shared/catalogs/skill-catalog';
import { ContactIcon } from '../../ui/contact-icon/contact-icon';
import { StarRating } from '../../ui/star-rating/star-rating';

/** Abschnitte, die an der Zeitleiste teilnehmen. */
type TimelineSection = 'experience' | 'education' | 'projects' | 'certificates';
/**
 * Vorlage „Klassisch“: einspaltiges A4-Layout mit Kopfbereich, optionaler Datumsspalte und Zeitleiste,
 * darunter Tabellen für Skills, Sprachen und Links. Wird über `TemplateHost` eingebettet.
 */
@Component({
  selector: 'app-template-classic',
  imports: [ContactIcon, StarRating],
  templateUrl: './template-classic.html',
  styleUrl: './template-classic.scss',
})
export class TemplateClassic {
  /** Die darzustellenden Lebenslaufdaten. */
  readonly data = input.required<CvData>();
  /** Design-Optionen (Sprache, Farbe, Foto, Datumsposition, Zeitleiste …). */
  readonly options = input.required<TemplateOptions>();

  protected readonly labels = computed(() => labelsFor(this.options().language));
  protected readonly hasPhoto = computed(() => this.options().showPhoto && !!this.options().photoDataUrl);
  protected readonly name = computed(() => joinMeta([this.data().personal.firstName, this.data().personal.lastName]).replaceAll(' · ', ' '));
  protected readonly contactItems = computed(() => contactEntries(this.data().personal, this.options().language));
  protected readonly linkItems = computed(() => linkEntries(this.data().personal));
  protected readonly factItems = computed(() => personalFactItems(this.data().personal, this.options().language));
  protected readonly skillGroups = computed(() => groupedSkills(this.data().skills, this.options().language));
  protected readonly spoken = computed(() => languageEntries(this.data().languages, this.options().language));
  /** Daten in eigener linker Spalte statt unter dem Titel? */
  protected readonly datesAside = computed(() => this.options().datePlace !== 'below');
  /** Abschnitt, dessen letzter Eintrag die Zeitleisten-Linie abschließt (Reihenfolge wie im HTML). */
  protected readonly lastTimelineSection = computed<TimelineSection | null>(() => {
    const data = this.data();
    const order: [TimelineSection, number][] = [
      ['experience', data.experience.length],
      ['education', data.education.length],
      ['certificates', data.certificates.length],
      ['projects', data.projects.length],
    ];
    return order.filter(([, count]) => count > 0).pop()?.[0] ?? null;
  });

  /** Verbindet die nicht-leeren Teile mit ' · ', z. B. 'Position · Firma'. */
  protected join(parts: string[]): string {
    return joinMeta(parts);
  }

  /** Formatierter Arbeitsort aus Stadt und Land. */
  protected place(item: { city: string; country: string }): string {
    return workplace(item.city, item.country, this.options().language);
  }

  /** Formatierter Zeitraum in der Lebenslaufsprache; `current` steht für „bis heute“. */
  protected range(from: string, until: string, current: boolean): string {
    return formatRange(from, until, current, this.options().language);
  }
}

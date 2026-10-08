import { Component, computed, input } from '@angular/core';
import type { CvData, TemplateOptions } from '@shared/cv/cv-data';
import { onAccentColor } from '@shared/format/color';
import { contactEntries, formatRange, joinMeta, linkEntries, personalFactItems, workplace } from '@shared/format/format';
import { labelsFor } from '@shared/i18n/labels';
import { languageEntries } from '@shared/catalogs/language-catalog';
import { groupedSkills } from '@shared/catalogs/skill-catalog';
import { StarRating } from '../../ui/star-rating/star-rating';

/**
 * Vorlage „Modern“: farbige Seitenleiste links (Foto, Name, Kontakt, Sprachen, Skills),
 * Hauptspalte rechts mit Berufserfahrung, Ausbildung usw. Wird über `TemplateHost` eingebettet.
 */
@Component({
  selector: 'app-template-modern',
  imports: [StarRating],
  templateUrl: './template-modern.html',
  styleUrl: './template-modern.scss',
})
export class TemplateModern {
  /** Die darzustellenden Lebenslaufdaten. */
  readonly data = input.required<CvData>();
  /** Design-Optionen (Sprache, Farbe, Foto, Datumsposition, Zeitleiste …). */
  readonly options = input.required<TemplateOptions>();

  protected readonly labels = computed(() => labelsFor(this.options().language));
  protected readonly hasPhoto = computed(() => this.options().showPhoto && !!this.options().photoDataUrl);
  /** Gut lesbare Textfarbe auf der Akzentfarbe der Seitenleiste. */
  protected readonly onAccent = computed(() => onAccentColor(this.options().accentColor));
  protected readonly name = computed(() => joinMeta([this.data().personal.firstName, this.data().personal.lastName]).replaceAll(' · ', ' '));
  /** Kontakt- und Link-Gruppen der Seitenleiste; leere Gruppen entfallen. */
  protected readonly sidebarGroups = computed(() => {
    const person = this.data().personal;
    const language = this.options().language;
    return [
      { title: this.labels().contact, entries: contactEntries(person, language) },
      { title: this.labels().links, entries: linkEntries(person) },
    ].filter((group) => group.entries.length > 0);
  });
  /** Daten rechts neben dem Titel statt darunter? */
  protected readonly datesAside = computed(() => this.options().datePlace !== 'below');
  protected readonly factItems = computed(() => personalFactItems(this.data().personal, this.options().language));
  protected readonly skillGroups = computed(() => groupedSkills(this.data().skills, this.options().language));
  protected readonly spoken = computed(() => languageEntries(this.data().languages, this.options().language));

  /** Formatierter Arbeitsort aus Stadt und Land. */
  protected place(item: { city: string; country: string }): string {
    return workplace(item.city, item.country, this.options().language);
  }

  /** Formatierter Zeitraum in der Lebenslaufsprache; `current` steht für „bis heute“. */
  protected range(from: string, until: string, current: boolean): string {
    return formatRange(from, until, current, this.options().language);
  }
}

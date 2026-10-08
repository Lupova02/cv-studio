import { Component, computed, input } from '@angular/core';
import type { CvData, TemplateOptions } from '@shared/cv/cv-data';
import { contactEntries, formatRange, joinMeta, linkEntries, personalFactItems, workplace } from '@shared/format/format';
import { labelsFor } from '@shared/i18n/labels';
import { languageEntries } from '@shared/catalogs/language-catalog';
import { groupedSkills } from '@shared/catalogs/skill-catalog';
import { ContactIcon } from '../../ui/contact-icon/contact-icon';
import { StarRating } from '../../ui/star-rating/star-rating';

/**
 * Vorlage „Minimal“: schlichtes A4-Layout mit Abschnittstiteln in einer linken Randspalte
 * und Inhalt daneben; Zeitleiste je Abschnitt. Wird über `TemplateHost` eingebettet.
 */
@Component({
  selector: 'app-template-minimal',
  imports: [ContactIcon, StarRating],
  templateUrl: './template-minimal.html',
  styleUrl: './template-minimal.scss',
})
export class TemplateMinimal {
  /** Die darzustellenden Lebenslaufdaten. */
  readonly data = input.required<CvData>();
  /** Design-Optionen (Sprache, Farbe, Foto, Datumsposition, Zeitleiste …). */
  readonly options = input.required<TemplateOptions>();

  protected readonly labels = computed(() => labelsFor(this.options().language));
  protected readonly hasPhoto = computed(() => this.options().showPhoto && !!this.options().photoDataUrl);
  protected readonly name = computed(() => joinMeta([this.data().personal.firstName, this.data().personal.lastName]).replaceAll(' · ', ' '));
  /** Zwei Spalten im Kopf: Kontaktdaten und Links; leere Gruppen entfallen. */
  protected readonly contactGroups = computed(() =>
    [contactEntries(this.data().personal, this.options().language), linkEntries(this.data().personal)].filter((group) => group.length > 0),
  );
  protected readonly factItems = computed(() => personalFactItems(this.data().personal, this.options().language));
  protected readonly skillGroups = computed(() => groupedSkills(this.data().skills, this.options().language));
  protected readonly spoken = computed(() => languageEntries(this.data().languages, this.options().language));
  /** Daten rechts neben dem Titel statt darunter? */
  protected readonly datesAside = computed(() => this.options().datePlace !== 'below');
  /** Zeitleiste (Linie mit Punkten) anzeigen? */
  protected readonly timeline = computed(() => this.options().timeline === 'line');

  /** Formatierter Arbeitsort aus Stadt und Land. */
  protected place(item: { city: string; country: string }): string {
    return workplace(item.city, item.country, this.options().language);
  }

  /** Formatierter Zeitraum in der Lebenslaufsprache; `current` steht für „bis heute“. */
  protected range(from: string, until: string, current: boolean): string {
    return formatRange(from, until, current, this.options().language);
  }
}

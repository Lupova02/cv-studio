import { Component, computed, inject, input, signal } from '@angular/core';
import { FormArray } from '@angular/forms';
import { skillCatalog, skillsInCatalogOrder } from '@shared/catalogs/skill-catalog';
import { LIMITS } from '@shared/cv/cv-data';
import { EditorCopy } from '../../../../core/state/editor-copy';
import { EditorSection } from '../../list-chrome/editor-section';
import { StarRating } from '../../../../ui/star-rating/star-rating';
import { createSkillGroup, type SkillGroup } from '../../form/cv-form';

/**
 * Abschnitt „Kenntnisse“: Die Nutzerin wählt eine Kategorie aus dem Katalog
 * und hakt dort Kenntnisse an bzw. vergibt 1–5 Sterne. Gespeichert werden nur
 * gewählte Kenntnisse, immer in der Reihenfolge des Katalogs.
 */
@Component({
  selector: 'app-skill-section',
  imports: [StarRating, EditorSection],
  templateUrl: './skill-section.html',
  styleUrl: './skill-section.scss',
})
export class SkillSection {
  protected readonly copy = inject(EditorCopy);
  /** Formular-Liste aller gewählten Kenntnisse (id + Sterne). */
  readonly items = input.required<FormArray<SkillGroup>>();
  /** Katalog in der aktuellen Lebenslauf-Sprache. */
  protected readonly catalog = computed(() => skillCatalog(this.copy.language()));
  /** Aktuell aufgeklappte Kategorie ('' = keine). */
  protected readonly categoryId = signal('');
  protected readonly active = computed(() => this.catalog().find((group) => group.id === this.categoryId()) ?? null);

  protected chooseCategory(id: string): void {
    this.categoryId.set(id);
  }

  /** Wie viele Kenntnisse dieser Kategorie bereits gewählt sind (für die Anzeige im Auswahlfeld). */
  protected count(id: string): number {
    const ids = new Set(this.catalog().find((group) => group.id === id)?.skills.map((skill) => skill.id));
    return this.items().getRawValue().filter((item) => ids.has(item.id) && item.stars > 0).length;
  }

  /** Sterne einer Kenntnis; 0 bedeutet „nicht gewählt“. */
  protected stars(id: string): number {
    return this.items().getRawValue().find((item) => item.id === id)?.stars ?? 0;
  }

  /** True, wenn die Höchstzahl an Kenntnissen erreicht ist. */
  protected full(): boolean {
    return this.items().length >= LIMITS.items;
  }

  /** Häkchen gesetzt/entfernt. Neu gewählte Kenntnisse starten mit 3 Sternen. */
  protected toggle(id: string, selected: boolean): void {
    const chosen = this.chosen();
    if (selected) {
      if (!chosen.has(id) && this.full()) {
        return;
      }
      chosen.set(id, chosen.get(id) || 3);
    } else {
      chosen.delete(id);
    }
    this.write(chosen);
  }

  /** Klick auf einen Stern; wählt die Kenntnis bei Bedarf gleich mit aus. */
  protected setStars(id: string, stars: number): void {
    const chosen = this.chosen();
    if (!chosen.has(id) && this.full()) {
      return;
    }
    chosen.set(id, stars);
    this.write(chosen);
  }

  /** Aktuelle Auswahl als Map id → Sterne. */
  private chosen(): Map<string, number> {
    return new Map(this.items().getRawValue().map((item) => [item.id, item.stars]));
  }

  /**
   * Baut die Formular-Liste neu auf, sortiert nach Katalog-Reihenfolge. Die Einzelschritte melden sich nicht,
   * erst am Ende gibt es genau eine Änderung – sonst würde jeder Eintrag einzeln gespeichert.
   */
  private write(chosen: Map<string, number>): void {
    const next = skillsInCatalogOrder(chosen);
    const items = this.items();
    items.clear({ emitEvent: false });
    for (const item of next) {
      items.push(createSkillGroup(item), { emitEvent: false });
    }
    items.updateValueAndValidity();
  }
}

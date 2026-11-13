import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input } from '@angular/core';
import { EditorCopy } from '../../../../core/state/editor-copy';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { countriesFor } from '@shared/catalogs/country-data';
import { LIMITS } from '@shared/cv/cv-data';
import { bulletControl, createExperienceGroup, type ExperienceGroup } from '../../form/cv-form';
import { dropFormItem, moveFormItem } from '../../form/form-array';
import { ItemActions } from '../../list-chrome/item-actions';
import { EditorSection } from '../../list-chrome/editor-section';
import { TrashIcon } from '../../../../ui/trash-icon/trash-icon';

/** Abschnitt „Berufserfahrung“: Stationen mit Position, Firma, Ort, Zeitraum, Beschreibung und Stichpunkten. */
@Component({
  selector: 'app-experience-section',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, EditorSection, ItemActions, TrashIcon],
  templateUrl: './experience-section.html',
})
export class ExperienceSection {
  protected readonly copy = inject(EditorCopy);
  /** Formular-Liste aller Berufsstationen. */
  readonly items = input.required<FormArray<ExperienceGroup>>();
  protected readonly limits = LIMITS;
  /** Länderliste für die Auswahl, Namen in der aktuellen Lebenslauf-Sprache. */
  protected readonly countries = computed(() => {
    const language = this.copy.language();
    return countriesFor(language).map((country) => ({ code: country.code, name: country.name[language] }));
  });

  /** Hängt eine leere Station an, solange die Höchstzahl nicht erreicht ist. */
  protected add(): void {
    if (this.items().length >= LIMITS.items) {
      return;
    }
    this.items().push(createExperienceGroup());
  }

  protected remove(index: number): void {
    this.items().removeAt(index);
  }

  /** Verschiebt per Pfeil-Knopf um eine Position. */
  protected move(index: number, delta: number): void {
    moveFormItem(this.items(), index, delta);
  }

  /** Übernimmt die neue Position nach Drag & Drop. */
  protected drop(event: CdkDragDrop<unknown>): void {
    dropFormItem(this.items(), event);
  }

  /** Neuer leerer Stichpunkt am Ende (bis zur Höchstzahl). */
  protected addBullet(group: ExperienceGroup): void {
    if (group.controls.bullets.length >= LIMITS.bullets) {
      return;
    }
    group.controls.bullets.push(bulletControl());
  }

  protected removeBullet(group: ExperienceGroup, index: number): void {
    group.controls.bullets.removeAt(index);
  }

  /** Stichpunkt um eine Position nach oben (-1) oder unten (+1) schieben. */
  protected moveBullet(group: ExperienceGroup, index: number, delta: number): void {
    moveFormItem(group.controls.bullets, index, delta);
  }

  /** „Aktuell“ angehakt: Enddatum sperren; sonst wieder freigeben. */
  protected toggleCurrent(group: ExperienceGroup): void {
    const until = group.controls.until;
    if (group.controls.current.value) {
      until.disable();
    } else {
      until.enable();
    }
  }
}

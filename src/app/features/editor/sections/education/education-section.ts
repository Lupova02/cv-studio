import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, inject, input } from '@angular/core';
import { EditorCopy } from '../../../../core/state/editor-copy';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { LIMITS } from '@shared/cv/cv-data';
import { createEducationGroup, type EducationGroup } from '../../form/cv-form';
import { dropFormItem, moveFormItem } from '../../form/form-array';
import { ItemActions } from '../../list-chrome/item-actions';
import { ListHeader } from '../../list-chrome/list-header';

/** Abschnitt „Ausbildung“: Einträge mit Abschluss, Einrichtung, Ort, Zeitraum und Beschreibung. */
@Component({
  selector: 'app-education-section',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, ListHeader, ItemActions],
  templateUrl: './education-section.html',
})
export class EducationSection {
  protected readonly copy = inject(EditorCopy);
  /** Formular-Liste aller Ausbildungen. */
  readonly items = input.required<FormArray<EducationGroup>>();
  protected readonly limits = LIMITS;

  /** Hängt einen leeren Eintrag an, solange die Höchstzahl nicht erreicht ist. */
  protected add(): void {
    if (this.items().length >= LIMITS.items) return;
    this.items().push(createEducationGroup());
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

  /** „Aktuell“ angehakt: Enddatum sperren; sonst wieder freigeben. */
  protected toggleCurrent(group: EducationGroup): void {
    const until = group.controls.until;
    if (group.controls.current.value) until.disable();
    else until.enable();
  }
}

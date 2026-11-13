import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, inject, input } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { LIMITS } from '@shared/cv/cv-data';
import { EditorCopy } from '../../../../core/state/editor-copy';
import { createReferenceGroup, type ReferenceGroup } from '../../form/cv-form';
import { dropFormItem, moveFormItem } from '../../form/form-array';
import { ItemActions } from '../../list-chrome/item-actions';
import { EditorSection } from '../../list-chrome/editor-section';

/** Abschnitt „Referenzen“: Liste mit Name, Position, Firma, E-Mail und Telefon der Referenzperson. */
@Component({
  selector: 'app-reference-section',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, EditorSection, ItemActions],
  templateUrl: './reference-section.html',
})
export class ReferenceSection {
  protected readonly copy = inject(EditorCopy);
  /** Formular-Liste aller Referenzen. */
  readonly items = input.required<FormArray<ReferenceGroup>>();
  protected readonly limits = LIMITS;

  /** Hängt eine leere Referenz an, solange die Höchstzahl nicht erreicht ist. */
  protected add(): void {
    if (this.items().length < LIMITS.items) this.items().push(createReferenceGroup());
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
}

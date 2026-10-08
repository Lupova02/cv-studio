import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, inject, input } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { LIMITS } from '@shared/cv/cv-data';
import { EditorCopy } from '../../../../core/state/editor-copy';
import { createCertificateGroup, type CertificateGroup } from '../../form/cv-form';
import { dropFormItem, moveFormItem } from '../../form/form-array';
import { ItemActions } from '../../list-chrome/item-actions';
import { ListHeader } from '../../list-chrome/list-header';

/** Abschnitt „Zertifikate“: Liste mit Name, Aussteller, Datum und Beschreibung. */
@Component({
  selector: 'app-certificate-section',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, ListHeader, ItemActions],
  templateUrl: './certificate-section.html',
})
export class CertificateSection {
  protected readonly copy = inject(EditorCopy);
  /** Formular-Liste aller Zertifikate. */
  readonly items = input.required<FormArray<CertificateGroup>>();
  protected readonly limits = LIMITS;

  /** Hängt ein leeres Zertifikat an, solange die Höchstzahl nicht erreicht ist. */
  protected add(): void {
    if (this.items().length < LIMITS.items) this.items().push(createCertificateGroup());
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

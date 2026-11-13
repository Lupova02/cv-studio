import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, inject, input } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { LIMITS } from '@shared/cv/cv-data';
import { EditorCopy } from '../../../../core/state/editor-copy';
import { TrashIcon } from '../../../../ui/trash-icon/trash-icon';
import { bulletControl, createProjectGroup, type ProjectGroup } from '../../form/cv-form';
import { dropFormItem, moveFormItem } from '../../form/form-array';
import { ItemActions } from '../../list-chrome/item-actions';
import { EditorSection } from '../../list-chrome/editor-section';

/** Abschnitt „Projekte“: Liste mit Name, Rolle, Zeitraum, Beschreibung und Stichpunkten. */
@Component({
  selector: 'app-project-section',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, EditorSection, ItemActions, TrashIcon],
  templateUrl: './project-section.html',
})
export class ProjectSection {
  protected readonly copy = inject(EditorCopy);
  /** Formular-Liste aller Projekte. */
  readonly items = input.required<FormArray<ProjectGroup>>();
  protected readonly limits = LIMITS;

  /** Hängt ein leeres Projekt an, solange die Höchstzahl nicht erreicht ist. */
  protected add(): void {
    if (this.items().length < LIMITS.items) this.items().push(createProjectGroup());
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
  protected addBullet(group: ProjectGroup): void {
    if (group.controls.bullets.length < LIMITS.bullets) group.controls.bullets.push(bulletControl());
  }

  protected removeBullet(group: ProjectGroup, index: number): void {
    group.controls.bullets.removeAt(index);
  }

  /** Stichpunkt um eine Position nach oben (-1) oder unten (+1) schieben. */
  protected moveBullet(group: ProjectGroup, index: number, delta: number): void {
    moveFormItem(group.controls.bullets, index, delta);
  }
}

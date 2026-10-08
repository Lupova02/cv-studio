import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, inject, input, output } from '@angular/core';
import { EditorCopy } from '../../../core/state/editor-copy';
import { TrashIcon } from '../../../ui/trash-icon/trash-icon';

/**
 * Knopfleiste oben rechts in jeder Eintragskarte: Ziehgriff, nach oben,
 * nach unten und Entfernen. Die Komponente meldet nur Ereignisse; das
 * Verschieben und Löschen erledigt der umgebende Abschnitt.
 */
@Component({
  selector: 'app-item-actions',
  imports: [CdkDragHandle, TrashIcon],
  template: `
    <div class="item-actions">
      <button type="button" class="icon-btn grip" cdkDragHandle [attr.aria-label]="copy.ui().drag"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="1.3" /><circle cx="15" cy="7" r="1.3" /><circle cx="9" cy="12" r="1.3" /><circle cx="15" cy="12" r="1.3" /><circle cx="9" cy="17" r="1.3" /><circle cx="15" cy="17" r="1.3" /></svg></button>
      <button type="button" class="icon-btn" (click)="move.emit(-1)" [disabled]="index() === 0" [attr.aria-label]="copy.ui().up"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14.5 12 8.5l6 6" /></svg></button>
      <button type="button" class="icon-btn" (click)="move.emit(1)" [disabled]="index() >= count() - 1" [attr.aria-label]="copy.ui().down"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5 12 15.5l6-6" /></svg></button>
      <button type="button" class="icon-btn danger" (click)="remove.emit()" [attr.aria-label]="copy.ui().remove" [attr.title]="copy.ui().remove"><app-trash-icon /></button>
    </div>
  `,
})
export class ItemActions {
  protected readonly copy = inject(EditorCopy);
  /** Position des Eintrags in der Liste (0 = oben). */
  readonly index = input.required<number>();
  /** Anzahl aller Einträge; sperrt „nach unten“ beim letzten Eintrag. */
  readonly count = input.required<number>();
  /** Verschieben um -1 (nach oben) oder +1 (nach unten). */
  readonly move = output<number>();
  /** Eintrag soll gelöscht werden. */
  readonly remove = output<void>();
}

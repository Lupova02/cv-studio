import { Component, inject, input, output } from '@angular/core';
import { EditorCopy } from '../../../core/state/editor-copy';

/**
 * Kopfzeile eines Listen-Abschnitts im Editor (z. B. „Berufserfahrung“):
 * Überschrift links, „Hinzufügen“-Knopf rechts.
 */
@Component({
  selector: 'app-list-header',
  template: `
    <header class="block-head">
      <h2>{{ title() }}</h2>
      <button type="button" class="btn-ghost" (click)="add.emit()" [disabled]="disabled()">{{ copy.ui().add }}</button>
    </header>
  `,
})
export class ListHeader {
  protected readonly copy = inject(EditorCopy);
  /** Überschrift des Abschnitts. */
  readonly title = input.required<string>();
  /** Sperrt „Hinzufügen“, z. B. wenn die Höchstzahl an Einträgen erreicht ist. */
  readonly disabled = input(false);
  /** Wird ausgelöst, wenn ein neuer Eintrag angelegt werden soll. */
  readonly add = output<void>();
}

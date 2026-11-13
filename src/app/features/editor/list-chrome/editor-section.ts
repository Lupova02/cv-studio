import { Component, computed, inject, input, output } from '@angular/core';
import { EditorCopy } from '../../../core/state/editor-copy';
import { SectionCollapse } from './section-collapse';

/**
 * Rahmen eines Editor-Abschnitts (z. B. „Berufserfahrung“): Überschrift als Auf-/Zuklapp-Knopf mit Anzahl,
 * optional „Hinzufügen“ rechts und darunter der animiert auf- und zuklappende Inhalt.
 * Zugeklappte Inhalte sind `inert`, also weder per Tab erreichbar noch für Screenreader sichtbar.
 */
@Component({
  selector: 'app-editor-section',
  host: { class: 'block', '[id]': "'sec-' + section()" },
  template: `
    <header class="block-head">
      <h2>
        <button
          type="button"
          class="section-title"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="bodyId()"
          (click)="collapse.toggle(section())"
        >
          <span class="collapse-toggle" [attr.data-open]="open()" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
          </span>
          {{ title() }}
          @if (count() !== null) {
            <span class="block-count">{{ count() }}</span>
          }
        </button>
      </h2>
      @if (addable()) {
        <button type="button" class="btn-ghost add" (click)="onAdd()" [disabled]="addDisabled()">+ {{ copy.ui().add }}</button>
      }
    </header>
    <div class="block-body" [class.closed]="!open()" [id]="bodyId()">
      <div class="block-inner" [inert]="!open()">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    h2 {
      min-width: 0;
    }

    .section-title {
      display: inline-flex;
      align-items: center;
      gap: 0.15rem;
      margin-left: -0.6rem;
      padding: 0 0.4rem 0 0;
      border: 0;
      background: transparent;
      color: var(--text);
      font: inherit;
      text-align: left;
    }

    .section-title:active:not(:disabled) {
      transform: none;
    }

    .add {
      flex: none;
      min-height: var(--tap);
    }
  `,
})
export class EditorSection {
  protected readonly copy = inject(EditorCopy);
  protected readonly collapse = inject(SectionCollapse);
  /** Kennung des Abschnitts (für Auf/Zu-Zustand und Sprungziel `#sec-…`). */
  readonly section = input.required<string>();
  readonly title = input.required<string>();
  /** Anzahl der Einträge; `null` = keine Anzeige. */
  readonly count = input<number | null>(null);
  /** Zeigt den „Hinzufügen“-Knopf. */
  readonly addable = input(false);
  /** Sperrt „Hinzufügen“, z. B. wenn die Höchstzahl an Einträgen erreicht ist. */
  readonly addDisabled = input(false);
  /** Wird ausgelöst, wenn ein neuer Eintrag angelegt werden soll. */
  readonly add = output<void>();

  protected readonly open = computed(() => this.collapse.isOpen(this.section()));
  protected readonly bodyId = computed(() => `sec-${this.section()}-body`);

  /** Neuer Eintrag: Abschnitt dabei aufklappen, damit er sichtbar wird. */
  protected onAdd(): void {
    this.collapse.open(this.section());
    this.add.emit();
  }
}

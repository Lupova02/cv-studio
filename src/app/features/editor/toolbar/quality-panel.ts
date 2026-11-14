import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { QualityHint } from '@shared/cv/cv-quality';
import { BackStack } from '../../../core/state/back-stack';
import { EditorCopy } from '../../../core/state/editor-copy';
import { BottomSheet } from '../../../ui/bottom-sheet/bottom-sheet';

/**
 * Knopf „Qualitätscheck“ mit Anzahl der Hinweise; öffnet eine Liste, aus der man direkt zum
 * betroffenen Feld springen kann. Breit als Popover, auf schmalen Bildschirmen als Bottom Sheet.
 */
@Component({
  selector: 'app-quality-panel',
  imports: [NgTemplateOutlet, BottomSheet],
  host: {
    '(document:pointerdown)': 'closeOnOutside($event)',
    '(keydown.escape)': 'open.set(false)',
  },
  template: `
    <button
      type="button"
      class="trigger"
      [class.warn]="warnings() > 0"
      [attr.aria-expanded]="open()"
      aria-haspopup="dialog"
      [attr.aria-label]="copy.ui().quality + ': ' + hints().length"
      [attr.title]="copy.ui().quality"
      (click)="open.update((value) => !value)"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l2.5 2.5L16 9" /><circle cx="12" cy="12" r="8.5" /></svg>
      <span class="label">{{ copy.ui().quality }}</span>
      @if (hints().length > 0) {
        <span class="count" aria-hidden="true">{{ hints().length }}</span>
      }
    </button>
    @if (open()) {
      @if (sheet()) {
        <app-bottom-sheet [label]="copy.ui().quality" [closeLabel]="copy.ui().close" (closed)="open.set(false)">
          <ng-container [ngTemplateOutlet]="list" />
        </app-bottom-sheet>
      } @else {
        <div class="popover" role="dialog" [attr.aria-label]="copy.ui().quality">
          <h3>{{ copy.ui().quality }}</h3>
          <ng-container [ngTemplateOutlet]="list" />
        </div>
      }
    }
    <ng-template #list>
      <p class="lead">{{ copy.ui().qualityIntro }}</p>
      @if (hints().length === 0) {
        <p class="good">{{ copy.ui().qualityAllGood }}</p>
      } @else {
        <ul>
          @for (hint of hints(); track hint.id) {
            <li>
              <button type="button" [class]="hint.level" (click)="go(hint)">
                <span class="dot" aria-hidden="true"></span>
                <span class="hint-text">{{ hint.text }}</span>
                <svg class="go" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
              </button>
            </li>
          }
        </ul>
      }
    </ng-template>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
    }

    .trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      min-height: var(--tap);
      padding: 0.3rem 0.65rem;
      font-weight: 600;
      font-size: 0.88rem;
    }

    .trigger svg {
      width: 1.1rem;
      height: 1.1rem;
      fill: none;
      stroke: var(--success);
      stroke-width: 1.9;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .trigger.warn svg {
      stroke: var(--warning);
    }

    .count {
      min-width: 1.35rem;
      padding: 0 0.35rem;
      border-radius: 999px;
      background: var(--surface-3);
      color: var(--text);
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
    }

    .trigger.warn .count {
      background: var(--warning-soft);
      color: var(--warning);
    }

    .popover {
      top: calc(100% + 0.4rem);
      right: 0;
      width: 24rem;
      transform-origin: top right;
    }

    ul {
      display: grid;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li button {
      display: flex;
      gap: 0.55rem;
      width: 100%;
      padding: 0.45rem 0.55rem;
      border: 0;
      background: transparent;
      text-align: left;
      font-size: 0.86rem;
      line-height: 1.35;
    }

    li button:hover {
      background: var(--surface-2);
    }

    .hint-text {
      flex: 1;
    }

    .go {
      flex: none;
      width: 1rem;
      height: 1rem;
      margin-top: 0.15rem;
      fill: none;
      stroke: var(--text-subtle);
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    app-bottom-sheet .lead {
      margin-top: 0;
    }

    app-bottom-sheet li button {
      min-height: var(--tap);
      padding: 0.65rem 0.4rem;
      font-size: 0.95rem;
    }

    app-bottom-sheet li + li button {
      border-top: 1px solid var(--border);
      border-radius: 0;
    }

    .dot {
      flex: none;
      width: 0.55rem;
      height: 0.55rem;
      margin-top: 0.35rem;
      border-radius: 50%;
      background: var(--text-subtle);
    }

    .warning .dot {
      background: var(--warning);
    }

    .good {
      margin: 0;
      color: var(--success);
      font-weight: 600;
    }

    @media (max-width: 640px) {
      /* Schmal: nur das Symbol, der Zähler sitzt als Badge an dessen Ecke. */
      .trigger {
        position: relative;
        justify-content: center;
        min-width: 2.6rem;
        padding: 0;
        border-color: transparent;
        background: transparent;
      }

      .trigger svg {
        width: 1.3rem;
        height: 1.3rem;
      }

      .count {
        position: absolute;
        top: 0.1rem;
        right: 0;
        min-width: 1.15rem;
        padding: 0 0.25rem;
        font-size: 0.68rem;
        line-height: 1.15rem;
      }

      .label {
        display: none;
      }

      .popover {
        position: fixed;
        top: calc(3.9rem + env(safe-area-inset-top));
        max-height: calc(100dvh - 9.5rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
        left: 0.75rem;
        right: 0.75rem;
        width: auto;
        max-width: none;
      }
    }
  `,
})
export class QualityPanel {
  protected readonly copy = inject(EditorCopy);
  readonly hints = input.required<QualityHint[]>();
  /** Als Bottom Sheet statt Popover anzeigen (schmale Bildschirme). */
  readonly sheet = input(false);
  /** Springt zum Feld bzw. Abschnitt eines Hinweises. */
  readonly jump = output<QualityHint>();
  readonly open = signal(false);
  protected readonly warnings = computed(() => this.hints().filter((hint) => hint.level === 'warning').length);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // Das Bottom Sheet meldet sich selbst bei der Zurück-Taste an, das Popover hier.
    inject(BackStack).track(computed(() => this.open() && !this.sheet()), () => this.open.set(false));
  }

  protected closeOnOutside(event: PointerEvent): void {
    if (this.open() && !this.sheet() && event.target instanceof Node && !this.host.contains(event.target)) {
      this.open.set(false);
    }
  }

  protected go(hint: QualityHint): void {
    this.open.set(false);
    this.jump.emit(hint);
  }
}

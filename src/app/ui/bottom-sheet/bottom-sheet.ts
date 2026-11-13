import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Menü als Bottom Sheet (schmale Bildschirme): Fläche am unteren Rand über einem abgedunkelten Hintergrund.
 * Schließt per Tippen auf den Hintergrund, Escape oder den Schließen-Knopf; der Fokus springt beim Öffnen
 * ins Sheet und beim Schließen zurück zum auslösenden Element. Der Inhalt wird hineinprojiziert.
 */
@Component({
  selector: 'app-bottom-sheet',
  host: {
    '(keydown.escape)': 'closed.emit()',
  },
  template: `
    <div class="scrim" (click)="closed.emit()" aria-hidden="true"></div>
    <section
      #panel
      class="sheet"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="label()"
      tabindex="-1"
    >
      <div class="grip" aria-hidden="true"></div>
      <header>
        <h2>{{ label() }}</h2>
        <button
          type="button"
          class="icon-btn"
          (click)="closed.emit()"
          [attr.aria-label]="closeLabel()"
          [attr.title]="closeLabel()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div class="body">
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 60;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .scrim {
      position: absolute;
      inset: 0;
      background: rgb(0 0 0 / 0.42);
      animation: fade-in var(--medium) ease;
    }

    .sheet {
      position: relative;
      display: flex;
      flex-direction: column;
      max-height: calc(100% - 2.5rem - env(safe-area-inset-top));
      padding: 0 max(1rem, env(safe-area-inset-right)) calc(1rem + env(safe-area-inset-bottom))
        max(1rem, env(safe-area-inset-left));
      border-top: 1px solid var(--border);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      background: var(--surface);
      color: var(--text);
      box-shadow: var(--shadow-lg);
      animation: sheet-up var(--medium) var(--ease);
    }

    .sheet:focus {
      outline: none;
    }

    .grip {
      width: 2.5rem;
      height: 0.3rem;
      margin: 0.5rem auto 0;
      border-radius: 999px;
      background: var(--border-strong);
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.35rem 0 0.5rem;
    }

    h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 650;
    }

    .icon-btn svg {
      width: 1.15rem;
      height: 1.15rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
    }

    .body {
      overflow: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    @keyframes sheet-up {
      from {
        transform: translateY(100%);
      }
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }
    }
  `,
})
export class BottomSheet {
  /** Überschrift und Name des Dialogs. */
  readonly label = input.required<string>();
  /** Name des Schließen-Knopfs. */
  readonly closeLabel = input.required<string>();
  readonly closed = output<void>();
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    afterNextRender(() => this.panel().nativeElement.focus());
    // Beim Schließen den Fokus an den auslösenden Knopf zurückgeben.
    inject(DestroyRef).onDestroy(() => opener?.focus({ preventScroll: true }));
  }
}

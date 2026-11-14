import { Component, ElementRef, computed, effect, inject, output, signal, viewChild } from '@angular/core';
import { BackStack } from '../../core/state/back-stack';
import { EditorCopy } from '../../core/state/editor-copy';
import { markOnboardingSeen } from './onboarding-state';

/**
 * Kurzer Einstieg beim ersten Start: drei Karten (Vorlage wählen, ausfüllen, PDF), jederzeit überspringbar.
 * Wird nur einmal gezeigt; der Editor entscheidet, wann.
 */
@Component({
  selector: 'app-onboarding',
  host: {
    '(keydown.escape)': 'finish()',
    '(keydown.arrowright)': 'next()',
    '(keydown.arrowleft)': 'previous()',
  },
  template: `
    <div class="backdrop">
      <section class="card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-text" tabindex="-1" #card>
        <div class="art" aria-hidden="true">
          @switch (step()) {
            @case (0) {
              <svg viewBox="0 0 64 64"><rect x="8" y="10" width="20" height="27" rx="2" /><rect x="36" y="10" width="20" height="27" rx="2" /><path d="M12 16h10M40 16h10M12 21h12M40 21h12" /><rect x="22" y="30" width="20" height="27" rx="2" class="fill" /><path d="M26 36h10M26 41h12M26 46h8" class="on" /></svg>
            }
            @case (1) {
              <svg viewBox="0 0 64 64"><rect x="12" y="8" width="40" height="48" rx="4" /><path d="M19 18h18M19 26h26M19 34h22M19 42h14" /><path d="M44 50 56 38l-4-4-12 12-1 5z" class="fill" /></svg>
            }
            @default {
              <svg viewBox="0 0 64 64"><path d="M36 8H18a4 4 0 0 0-4 4v40a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V22z" /><path d="M36 8v14h14" /><rect x="20" y="34" width="24" height="12" rx="2" class="fill" /><path d="M24 40h16" class="on" /></svg>
            }
          }
        </div>
        <p class="counter">{{ step() + 1 }} / {{ cards().length }}</p>
        <h2 id="onboarding-title">{{ cards()[step()]?.title }}</h2>
        <p id="onboarding-text" class="text">{{ cards()[step()]?.text }}</p>
        <div class="dots" aria-hidden="true">
          @for (card of cards(); track $index) {
            <span [class.active]="$index === step()"></span>
          }
        </div>
        <div class="actions">
          <button type="button" class="btn-ghost" (click)="finish()">{{ copy.ui().onboardingSkip }}</button>
          @if (step() < cards().length - 1) {
            <button type="button" class="btn-solid" (click)="next()">{{ copy.ui().onboardingNext }}</button>
          } @else {
            <button type="button" class="btn-solid" (click)="finish()">{{ copy.ui().onboardingStart }}</button>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 90;
      display: grid;
      place-items: center;
      padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom))
        max(1rem, env(safe-area-inset-left));
      background: var(--overlay);
      animation: fade-in var(--medium) ease;
    }

    .card {
      display: grid;
      justify-items: center;
      gap: 0.6rem;
      width: min(24rem, 100%);
      padding: 1.5rem 1.25rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      color: var(--text);
      text-align: center;
      box-shadow: var(--shadow-lg);
      animation: pop-in var(--medium) var(--ease);
    }

    .card:focus {
      outline: none;
    }

    .art svg {
      width: 5.5rem;
      height: 5.5rem;
      fill: none;
      stroke: var(--accent);
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .art .fill {
      fill: var(--accent-soft);
    }

    .counter {
      margin: 0;
      color: var(--text-subtle);
      font-size: 0.78rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    h2 {
      margin: 0;
      font-size: 1.2rem;
    }

    .text {
      margin: 0;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .dots {
      display: flex;
      gap: 0.4rem;
      margin: 0.25rem 0;
    }

    .dots span {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--border-strong);
      transition: background var(--fast) ease, transform var(--fast) ease;
    }

    .dots span.active {
      background: var(--accent);
      transform: scale(1.25);
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      width: 100%;
      margin-top: 0.25rem;
    }

    .actions button {
      min-height: var(--tap);
      font-size: 0.9rem;
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }
    }
  `,
})
export class Onboarding {
  protected readonly copy = inject(EditorCopy);
  /** Einstieg beendet oder übersprungen. */
  readonly done = output<void>();
  protected readonly step = signal(0);
  protected readonly cards = computed(() => {
    const ui = this.copy.ui();
    return [
      { title: ui.onboarding1Title, text: ui.onboarding1Text },
      { title: ui.onboarding2Title, text: ui.onboarding2Text },
      { title: ui.onboarding3Title, text: ui.onboarding3Text },
    ];
  });
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');

  constructor() {
    inject(BackStack).track(signal(true), () => this.finish());
    // Fokus in die Karte, damit Screenreader den Text vorlesen und Tasten wirken.
    effect(() => {
      this.step();
      this.card().nativeElement.focus();
    });
  }

  protected next(): void {
    this.step.update((value) => Math.min(value + 1, this.cards().length - 1));
  }

  protected previous(): void {
    this.step.update((value) => Math.max(value - 1, 0));
  }

  protected finish(): void {
    markOnboardingSeen();
    this.done.emit();
  }
}

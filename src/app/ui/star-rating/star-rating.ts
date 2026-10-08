import { Component, computed, input, output } from '@angular/core';
import type { SkillScale } from '@shared/cv/cv-data';

/**
 * Bewertung von 0–5 als Sterne oder Balken. In den Vorlagen nur zur Anzeige,
 * im Editor mit `interactive` als klickbare Sterne zum Einstellen.
 */
@Component({
  selector: 'app-star-rating',
  template: `
    @if (!interactive() && mode() === 'bars') {
      <span class="track" role="img" [attr.aria-label]="value() + ' / 5'">
        <span class="fill" [style.width.%]="share()"></span>
      </span>
    } @else {
      <span class="rating" [attr.role]="interactive() ? null : 'img'" [attr.aria-label]="interactive() ? null : value() + ' / 5'">
        @for (star of scale; track star) {
          @if (interactive()) {
            <button type="button" [class.on]="star <= value()" (click)="pick.emit(star)" [attr.aria-label]="star + ' / 5'">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l2.6 6.2 6.7.6-5.1 4.4 1.6 6.5L12 16.7 6.2 20.1l1.6-6.5L2.7 9.2l6.7-.6z" /></svg>
            </button>
          } @else {
            <svg viewBox="0 0 24 24" aria-hidden="true" [class.on]="star <= value()"><path d="M12 2.4l2.6 6.2 6.7.6-5.1 4.4 1.6 6.5L12 16.7 6.2 20.1l1.6-6.5L2.7 9.2l6.7-.6z" /></svg>
          }
        }
      </span>
    }
  `,
  styles: `
    .rating {
      display: inline-flex;
      gap: 0.35mm;
      align-items: center;
      line-height: 0;
    }

    .rating:has(button) {
      gap: 0.15rem;
    }

    svg {
      width: 3.1mm;
      height: 3.1mm;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
      stroke-linejoin: round;
      opacity: 0.4;
    }

    svg.on,
    button.on svg {
      fill: #f5a018;
      stroke: none;
      opacity: 1;
    }

    button {
      display: grid;
      padding: 0;
      border: 0;
      background: transparent;
      color: #d6d3d1;
      line-height: 0;
      cursor: pointer;
    }

    button svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    button.on {
      color: #f5a018;
    }

    .track {
      display: inline-block;
      width: 16mm;
      height: 1.8mm;
      border-radius: 1mm;
      background: color-mix(in srgb, currentColor 28%, transparent);
      overflow: hidden;
      vertical-align: middle;
    }

    .fill {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--bar, var(--accent, #1f4b99));
    }
  `,
})
export class StarRating {
  /** Aktueller Wert (0–5). */
  readonly value = input(0);
  /** Klickbare Sterne statt reiner Anzeige; dann immer Sterne, nie Balken. */
  readonly interactive = input(false);
  /** Darstellung in der Anzeige: Sterne oder Balken. */
  readonly mode = input<SkillScale>('stars');
  /** Meldet den angeklickten Stern (1–5). */
  readonly pick = output<number>();
  protected readonly scale = [1, 2, 3, 4, 5];
  /** Füllgrad des Balkens in Prozent, auf 0–5 begrenzt. */
  protected readonly share = computed(() => (Math.min(5, Math.max(0, this.value())) / 5) * 100);
}

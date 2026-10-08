import { Component } from '@angular/core';

/** Mülleimer-Icon für Löschen-Schaltflächen im Editor; übernimmt die Textfarbe. */
@Component({
  selector: 'app-trash-icon',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l1 12.5h9l1-12.5" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
    }

    svg {
      width: 1rem;
      height: 1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class TrashIcon {}

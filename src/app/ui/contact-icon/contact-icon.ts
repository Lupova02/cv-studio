import { Component, input } from '@angular/core';
import type { ContactIcon as ContactIconName } from '@shared/format/format';

/** Kleines Strich-Icon für Kontaktarten (E-Mail, Telefon, Adresse, LinkedIn …); übernimmt die Textfarbe. Genutzt in den Vorlagen. */
@Component({
  selector: 'app-contact-icon',
  template: `
    @switch (icon()) {
      @case ('email') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></svg>
      }
      @case ('mobile') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></svg>
      }
      @case ('home') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.2h10a1.6 1.6 0 011.6 1.6V8H5.4V5.8A1.6 1.6 0 017 4.2z" /><path d="M4.2 9.4h15.6" /><rect x="6.2" y="10.8" width="11.6" height="9.2" rx="1.6" /><circle cx="12" cy="15.2" r="2.15" /></svg>
      }
      @case ('work') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M3 12h18" /></svg>
      }
      @case ('fax') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="1" width="10" height="7" rx="1" /><path d="M9.5 3.2h5M9.5 5.4h3.5" /><rect x="2" y="10" width="20" height="11" rx="2" /><path d="M6 10v2.2M18 10v2.2M6 15.5h7" /><circle cx="17" cy="15.5" r="1.6" /></svg>
      }
      @case ('phone') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h3l2 4-2.2 1.2a11 11 0 005 5L16 11l4 2v3a2 2 0 01-2 2A15 15 0 015 5a2 2 0 012-2z" /></svg>
      }
      @case ('address') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.2" /></svg>
      }
      @case ('linkedin') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 11v6M8 8h.01M12 17v-3.5a2 2 0 014 0V17" /></svg>
      }
      @case ('github') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-4 1.5-4-2.5-6-3m12 6v-3.5a3.2 3.2 0 00-.9-2.5c3-.3 6-1.4 6-6.3a4.8 4.8 0 00-1.3-3.4 4.5 4.5 0 00-.1-3.4s-1.1-.3-3.5 1.3a12 12 0 00-6.4 0C6.4 2.8 5.3 3.1 5.3 3.1a4.5 4.5 0 00-.1 3.4A4.8 4.8 0 003.9 10c0 4.8 3 6 6 6.3a3.2 3.2 0 00-.9 2.5V22" /></svg>
      }
      @case ('website') {
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-6-3.8-9S9.5 5.8 12 3z" /></svg>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      width: 4mm;
      height: 4mm;
    }

    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class ContactIcon {
  /** Welches Icon gezeigt wird. */
  readonly icon = input.required<ContactIconName>();
}

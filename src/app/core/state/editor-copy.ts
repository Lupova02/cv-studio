import { Injectable, computed, inject } from '@angular/core';
import { labelsFor } from '@shared/i18n/labels';
import { uiText } from '@shared/i18n/ui-text';
import { CvState } from './cv-state';

/** Liefert dem Editor alle Beschriftungen und UI-Texte in der aktuell gewählten Lebenslaufsprache. */
@Injectable({ providedIn: 'root' })
export class EditorCopy {
  private readonly state = inject(CvState);
  /** Aktuell gewählte Sprache des Lebenslaufs. */
  readonly language = computed(() => this.state.data().template.language);
  /** Beschriftungen des Lebenslaufs (Abschnittstitel usw.). */
  readonly cv = computed(() => labelsFor(this.language()));
  /** Texte der Bedienoberfläche (Schaltflächen, Meldungen usw.). */
  readonly ui = computed(() => uiText(this.language()));
}

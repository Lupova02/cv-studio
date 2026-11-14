import { Component, computed, inject, input, signal } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { languageCatalog, languageLevels, levelWhen } from '@shared/catalogs/language-catalog';
import { LIMITS } from '@shared/cv/cv-data';
import { haptic } from '../../../../core/native/native-bridge';
import { EditorCopy } from '../../../../core/state/editor-copy';
import { EditorSection } from '../../list-chrome/editor-section';
import { TrashIcon } from '../../../../ui/trash-icon/trash-icon';
import { createLanguageGroup, type LanguageGroup } from '../../form/cv-form';

/**
 * Abschnitt „Sprachen“: Sprachen aus dem Katalog hinzufügen, Niveau
 * (Muttersprache, A1–C2) wählen und wieder entfernen. Die Anzeige ist
 * alphabetisch in der aktuellen Lebenslauf-Sprache sortiert.
 */
@Component({
  selector: 'app-language-section',
  imports: [ReactiveFormsModule, TrashIcon, EditorSection],
  templateUrl: './language-section.html',
  styleUrl: './language-section.scss',
})
export class LanguageSection {
  protected readonly copy = inject(EditorCopy);
  /** Formular-Liste der gewählten Sprachen (id + Niveau). */
  readonly items = input.required<FormArray<LanguageGroup>>();
  /** Im Auswahlfeld gewählte, aber noch nicht hinzugefügte Sprache. */
  protected readonly pending = signal('');
  protected readonly levels = computed(() => languageLevels(this.copy.language()));

  /** Katalog-Sprachen, die noch nicht gewählt wurden. */
  protected available() {
    const chosen = new Set(this.items().getRawValue().map((item) => item.id));
    return languageCatalog(this.copy.language()).filter((language) => !chosen.has(language.id));
  }

  /** Gewählte Sprachen alphabetisch nach ihrem Namen in der aktuellen Sprache. */
  protected ordered(): LanguageGroup[] {
    const language = this.copy.language();
    const names = new Map(languageCatalog(language).map((item) => [item.id, item.name]));
    return this.items().controls
      .filter((group) => names.has(group.controls.id.value))
      .sort((a, b) => (names.get(a.controls.id.value) ?? '').localeCompare(names.get(b.controls.id.value) ?? '', language));
  }

  /** Anzeigename einer Sprache, z. B. „Englisch“. */
  protected nameOf(id: string): string {
    return languageCatalog(this.copy.language()).find((item) => item.id === id)?.name ?? '';
  }

  /** Erklärtext zum gewählten Niveau. */
  protected reason(level: string): string {
    return levelWhen(level, this.copy.language());
  }

  protected full(): boolean {
    return this.items().length >= LIMITS.items;
  }

  /** Fügt die vorgemerkte Sprache hinzu (ohne Niveau) und leert die Auswahl. */
  protected add(): void {
    const id = this.pending();
    if (!id || this.full() || this.items().getRawValue().some((item) => item.id === id)) {
      return;
    }
    this.items().push(createLanguageGroup({ id, level: '' }));
    this.pending.set('');
  }

  /** Entfernt eine Sprache über ihre id (die Anzeige ist sortiert, der Index also nicht verlässlich). */
  protected remove(id: string): void {
    const index = this.items().controls.findIndex((group) => group.controls.id.value === id);
    if (index >= 0) {
      this.items().removeAt(index);
      haptic('warning');
    }
  }
}

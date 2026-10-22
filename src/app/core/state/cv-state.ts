import { Injectable, signal } from '@angular/core';
import { emptyCv, type CvData, type CvLanguage } from '@shared/cv/cv-data';
import { translateCv } from '@shared/cv/cv-translate';
import { uiText } from '@shared/i18n/ui-text';
import { getCvApi } from '../api/cv-api';
import { toErrorMessage } from '../errors';
import { translateTexts } from '../translation/local-translator';

/**
 * Zentraler App-Zustand: Lebenslaufdaten, Foto, automatisches Speichern, Muster-Modus, Import/Export
 * und Übersetzung mit Rückgängig. Wird vom Editor und von `EditorCopy` verwendet.
 */
@Injectable({ providedIn: 'root' })
export class CvState {
  /** Aktuell angezeigte Lebenslaufdaten (eigene Daten oder Muster). */
  readonly data = signal<CvData>(emptyCv());
  /** Foto als Data-URL für die Vorschau, `null` ohne Foto. */
  readonly photoUrl = signal<string | null>(null);
  /** Startphase: lädt noch, bereit oder schwerer Fehler (z. B. keine Desktop-Schnittstelle). */
  readonly phase = signal<'booting' | 'ready' | 'fatal'>('booting');
  /** Status des automatischen Speicherns für die Anzeige. */
  readonly saveState = signal<'idle' | 'pending' | 'saved' | 'error'>('idle');
  /** Aktuelle Fehlermeldung für die Oberfläche. */
  readonly error = signal<string | null>(null);
  /** Kurze Erfolgs-/Hinweismeldung (z. B. „Sicherung gespeichert“). */
  readonly notice = signal<string | null>(null);
  /** Zähler, der bei komplett ersetzten Daten steigt, damit der Editor seine Formulare neu aufbaut. */
  readonly generation = signal(0);
  /** Läuft gerade ein Export oder eine Übersetzung? Sperrt parallele Aktionen. */
  readonly busy = signal(false);
  /** Wird gerade der Muster-Lebenslauf statt der eigenen Daten gezeigt? */
  readonly sampleActive = signal(false);
  /** Läuft gerade eine Übersetzung? */
  readonly translating = signal(false);
  /** Kann die letzte Übersetzung noch rückgängig gemacht werden? */
  readonly canUndoTranslation = signal(false);

  /** Der eigene Lebenslauf, solange das Muster angezeigt wird; das Muster selbst wird nie gespeichert. */
  private stash: { data: CvData; photoUrl: string | null } | null = null;
  /** Nur bis zur nächsten Änderung gültig, damit Rückgängig nie etwas verwirft, das nach der Übersetzung eingegeben wurde. */
  private beforeTranslation: CvData | null = null;
  private persistEnabled = false;
  private dirty = false;
  private writing = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    try {
      // Beim Schließen des Fensters noch ausstehende Änderungen speichern.
      getCvApi().prepareForClose(() => this.flush());
    } catch (error) {
      this.fail(error);
      return;
    }
    void this.init();
  }

  /** Übernimmt eine Bearbeitung aus dem Editor und plant das Speichern ein. */
  replaceDraft(data: CvData): void {
    this.dropUndo();
    this.data.set(data);
    this.error.set(null);
    this.scheduleSave();
  }

  /** Meldet ungültige Eingaben: zeigt den Fehler und verwirft das geplante Speichern. */
  reportInvalid(message: string): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.dirty = false;
    this.error.set(message);
    this.saveState.set('error');
  }

  /** Zeigt einen Fehler einer Aktion (z. B. Import/Export), ohne das automatische Speichern zu beeinflussen. */
  reportError(message: string): void {
    this.notice.set(null);
    this.error.set(message);
  }

  /** Setzt Daten und Foto nach einem Foto-Import bzw. Entfernen des Fotos. */
  applyPhoto(data: CvData, photoUrl: string | null): void {
    this.data.set(data);
    this.photoUrl.set(photoUrl);
    this.scheduleSave();
  }

  /** Schaltet zwischen Muster-Lebenslauf und eigenen Daten um; Design-Einstellungen bleiben dabei erhalten. */
  toggleSample(sample: CvData): void {
    this.dropUndo();
    const current = this.data();
    // Zurück zu den eigenen Daten; im Muster geänderte Design-Einstellungen werden übernommen.
    if (this.stash) {
      const { data, photoUrl } = this.stash;
      this.stash = null;
      this.sampleActive.set(false);
      this.show({ ...data, template: current.template }, photoUrl);
      this.scheduleSave();
      return;
    }
    // Ausstehende Änderungen sofort speichern, bevor das Muster das Speichern blockiert.
    if (this.timer) {
      void this.flush();
    }
    this.stash = { data: current, photoUrl: this.photoUrl() };
    this.sampleActive.set(true);
    this.notice.set(null);
    this.show({ ...sample, template: current.template }, null);
  }

  /** Ersetzt den Lebenslauf komplett (z. B. durch eine importierte Sicherung) und löscht ein nicht mehr benötigtes altes Foto. */
  async replaceExternal(data: CvData, photoUrl: string | null): Promise<void> {
    const previous = (this.stash?.data ?? this.data()).personal.photoFile;
    this.endSample();
    this.photoUrl.set(photoUrl);
    this.data.set(data);
    this.error.set(null);
    this.generation.update((value) => value + 1);
    this.scheduleSave();
    if (previous && previous !== data.personal.photoFile) {
      await getCvApi().removePhoto(previous).catch(() => undefined);
    }
  }

  /** Beginnt mit einem leeren Lebenslauf und speichert ihn sofort. */
  async startEmpty(): Promise<void> {
    this.endSample();
    this.photoUrl.set(null);
    this.error.set(null);
    this.notice.set(null);
    this.data.set(emptyCv());
    this.persistEnabled = true;
    this.dirty = true;
    this.generation.update((value) => value + 1);
    this.phase.set('ready');
    await this.flush();
  }

  /** Löscht Einträge und Foto, behält aber Design und Sprache, damit die Oberfläche so bleibt, wie die Nutzerin sie eingerichtet hat. */
  async deleteAll(): Promise<void> {
    const current = this.stash?.data ?? this.data();
    const template = this.data().template;
    this.endSample();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.photoUrl.set(null);
    this.error.set(null);
    this.data.set({ ...emptyCv(), template });
    this.dirty = true;
    this.generation.update((value) => value + 1);
    await this.flush();
    if (current.personal.photoFile) {
      await getCvApi().removePhoto(current.personal.photoFile).catch(() => undefined);
    }
    this.notice.set(this.ui().dataDeleted);
  }

  /** Lässt eine Sicherungsdatei auswählen und übernimmt deren Inhalt. */
  async importBackup(): Promise<void> {
    const imported = await getCvApi().importBackup();
    if (!imported) {
      return;
    }
    await this.replaceExternal(imported.data, imported.photo?.dataUrl ?? null);
    this.notice.set(this.ui().backupImported);
  }

  /** Übersetzt alle Texte offline von `from` nach `to`; `true` bei Erfolg. Danach ist Rückgängig möglich. */
  async translate(from: CvLanguage, to: CvLanguage): Promise<boolean> {
    if (this.busy() || from === to) {
      return false;
    }
    const before = this.data();
    this.busy.set(true);
    this.translating.set(true);
    this.notice.set(null);
    this.error.set(null);
    try {
      const translated = await translateCv(before, (texts) => translateTexts(texts, from, to));
      // Wurde während der Übersetzung weiter bearbeitet, würde das Ergebnis diese Änderungen überschreiben.
      if (this.data() !== before) {
        this.error.set(this.ui().translateStale);
        return false;
      }
      this.show({ ...translated, template: { ...translated.template, language: to } }, this.photoUrl());
      this.scheduleSave();
      this.beforeTranslation = before;
      this.canUndoTranslation.set(true);
      this.notice.set(this.ui().translated);
      return true;
    } catch (error) {
      console.error(error);
      this.error.set(this.ui().translateFailed);
      return false;
    } finally {
      this.busy.set(false);
      this.translating.set(false);
    }
  }

  /** Stellt den Stand vor der letzten Übersetzung wieder her. */
  undoTranslation(): void {
    const before = this.beforeTranslation;
    if (!before) {
      return;
    }
    this.dropUndo();
    this.show(before, this.photoUrl());
    this.scheduleSave();
    this.notice.set(this.ui().translateUndone);
  }

  /**
   * Speichert zuerst und exportiert dann eine Sicherungsdatei (JSON inkl. Foto).
   * Auch bei eingeblendetem Muster wird der eigene Lebenslauf gesichert, nie das Muster.
   */
  async exportBackup(): Promise<void> {
    await this.flush();
    const saved = await getCvApi().exportBackup(this.stash?.data ?? this.data());
    this.notice.set(saved ? this.ui().backupSaved : null);
  }

  /** Exportiert den Lebenslauf mit der gewählten Vorlage und den Design-Optionen als PDF. */
  async exportPdf(): Promise<void> {
    await this.runExport(async () => {
      const data = this.data();
      return getCvApi().exportPdf({
        templateId: data.template.templateId,
        data,
        options: {
          showPhoto: data.template.showPhoto,
          showGender: data.template.showGender,
          accentColor: data.template.accentColor,
          language: data.template.language,
          skillScale: data.template.skillScale,
          datePlace: data.template.datePlace,
          timeline: data.template.timeline,
          entryOrder: data.template.entryOrder,
          font: data.template.font,
          pageNumbers: data.template.pageNumbers,
          pageNumberPlace: data.template.pageNumberPlace,
        },
      });
    }, 'pdfSaved');
  }

  /** Schreibt ausstehende Änderungen sofort auf die Festplatte; nie im Muster-Modus und nie zwei Schreibvorgänge gleichzeitig. */
  async flush(): Promise<void> {
    if (!this.persistEnabled || this.writing || this.sampleActive()) {
      return;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.dirty) {
      return;
    }
    this.writing = true;
    this.dirty = false;
    const snapshot = this.data();
    this.saveState.set('pending');
    try {
      await getCvApi().save(snapshot);
      this.saveState.set('saved');
      this.error.set(null);
    } catch (error) {
      this.dirty = true;
      this.saveState.set('error');
      this.error.set(toErrorMessage(error));
    } finally {
      this.writing = false;
      // Während des Schreibens eingegangene Änderungen (oder ein Fehlschlag) lösen einen neuen Versuch aus.
      if (this.dirty) {
        this.scheduleSave();
      }
    }
  }

  /** Lädt beim Start den gespeicherten Lebenslauf samt Foto. */
  private async init(): Promise<void> {
    try {
      let data = await getCvApi().load();
      let photoUrl: string | null = null;
      let cleaned = false;
      // Verweist der Lebenslauf auf ein fehlendes Foto, wird der Verweis entfernt und gespeichert.
      if (data.personal.photoFile) {
        photoUrl = await getCvApi().readPhoto(data.personal.photoFile);
        if (!photoUrl) {
          data = { ...data, personal: { ...data.personal, photoFile: '' } };
          cleaned = true;
        }
      }
      this.data.set(data);
      this.photoUrl.set(photoUrl);
      this.persistEnabled = true;
      if (cleaned) {
        this.dirty = true;
        await this.flush();
      }
      this.generation.update((value) => value + 1);
      this.phase.set('ready');
    } catch (error) {
      this.fail(error);
    }
  }

  /** Zeigt komplett neue Daten an und lässt den Editor seine Formulare neu aufbauen. */
  private show(data: CvData, photoUrl: string | null): void {
    this.photoUrl.set(photoUrl);
    this.data.set(data);
    this.error.set(null);
    this.generation.update((value) => value + 1);
  }

  private dropUndo(): void {
    this.beforeTranslation = null;
    this.canUndoTranslation.set(false);
  }

  /** Beendet den Muster-Modus, ohne die eigenen Daten zurückzuholen. */
  private endSample(): void {
    this.dropUndo();
    this.stash = null;
    this.sampleActive.set(false);
  }

  /** Speichert verzögert (400 ms nach der letzten Änderung), damit nicht jeder Tastendruck schreibt. */
  private scheduleSave(): void {
    if (!this.persistEnabled || this.sampleActive()) {
      return;
    }
    this.dirty = true;
    this.notice.set(null);
    this.saveState.set('pending');
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, 400);
  }

  /** UI-Texte in der aktuellen Lebenslaufsprache. */
  private ui() {
    return uiText(this.data().template.language);
  }

  /** Gemeinsamer Ablauf für Exporte: sperren, vorher speichern, Erfolg melden oder Fehler anzeigen. */
  private async runExport(action: () => Promise<boolean>, success: 'pdfSaved'): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.notice.set(null);
    try {
      await this.flush();
      const saved = await action();
      this.notice.set(saved ? this.ui()[success] : null);
    } catch (error) {
      this.error.set(toErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /** Wechselt in den schweren Fehlerzustand, in dem der Editor nicht nutzbar ist. */
  private fail(error: unknown): void {
    this.phase.set('fatal');
    this.error.set(toErrorMessage(error));
  }
}

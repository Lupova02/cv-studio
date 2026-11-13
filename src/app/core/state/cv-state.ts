import { Injectable, signal } from '@angular/core';
import { emptyCv, type CvData, type CvLanguage } from '@shared/cv/cv-data';
import type { CvLibrary } from '@shared/cv/cv-library';
import { translateCv } from '@shared/cv/cv-translate';
import { uiText } from '@shared/i18n/ui-text';
import { History } from '@shared/state/history';
import { SaveScheduler } from '@shared/state/save-scheduler';
import { getCvApi } from '../api/cv-api';
import { toErrorMessage } from '../errors';
import { translateTexts } from '../translation/local-translator';

/**
 * Zentraler App-Zustand: Lebenslaufdaten, Foto, automatisches Speichern, Rückgängig/Wiederholen, Muster-Modus,
 * mehrere Lebensläufe, Import/Export und Übersetzung. Wird vom Editor und von `EditorCopy` verwendet.
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
  /** Läuft gerade ein Export, eine Übersetzung oder ein Lebenslauf-Wechsel? Sperrt parallele Aktionen. */
  readonly busy = signal(false);
  /** Wird gerade der Muster-Lebenslauf statt der eigenen Daten gezeigt? */
  readonly sampleActive = signal(false);
  /** Läuft gerade eine Übersetzung? */
  readonly translating = signal(false);
  /** Kann die letzte Übersetzung noch rückgängig gemacht werden (Knopf im Hinweisbalken)? */
  readonly canUndoTranslation = signal(false);
  /** Gibt es Schritte für Rückgängig bzw. Wiederholen? */
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);
  /** Verzeichnis aller gespeicherten Lebensläufe; `null`, solange es nicht geladen ist. */
  readonly library = signal<CvLibrary | null>(null);

  /** Der eigene Lebenslauf, solange das Muster angezeigt wird; das Muster selbst wird nie gespeichert. */
  private stash: { data: CvData; photoUrl: string | null } | null = null;
  private persistEnabled = false;
  private readonly history = new History<CvData>();
  private readonly saver = new SaveScheduler<CvData>({
    canSave: () => this.persistEnabled && !this.sampleActive(),
    snapshot: () => this.data(),
    write: (data) => getCvApi().save(data),
    status: (status, error) => {
      this.saveState.set(status);
      if (status === 'pending') {
        this.notice.set(null);
      } else if (status === 'saved') {
        this.error.set(null);
      } else {
        this.error.set(toErrorMessage(error));
      }
    },
  });

  constructor() {
    try {
      // Beim Schließen des Fensters noch ausstehende Änderungen speichern (Electron).
      getCvApi().prepareForClose(() => this.flush());
    } catch (error) {
      this.fail(error);
      return;
    }
    // Browser und Mobile: Wird die App verlassen oder in den Hintergrund geschickt, sofort speichern.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          void this.flush();
        }
      });
      window.addEventListener('pagehide', () => void this.flush());
    }
    void this.init();
  }

  /** Übernimmt eine Bearbeitung aus dem Editor, merkt den vorherigen Stand für Rückgängig und plant das Speichern ein. */
  replaceDraft(data: CvData): void {
    this.dropTranslationUndo();
    this.history.record(this.data(), Date.now());
    this.syncHistory();
    this.data.set(data);
    this.error.set(null);
    this.saver.schedule();
  }

  /** Meldet ungültige Eingaben: zeigt den Fehler und verwirft das geplante Speichern. */
  reportInvalid(message: string): void {
    this.saver.cancel();
    this.error.set(message);
    this.saveState.set('error');
  }

  /** Zeigt einen Fehler einer Aktion (z. B. Import/Export), ohne das automatische Speichern zu beeinflussen. */
  reportError(message: string): void {
    this.notice.set(null);
    this.error.set(message);
  }

  /** Setzt Daten und Foto nach einem Foto-Import bzw. Entfernen des Fotos (nicht Teil von Rückgängig, weil die alte Datei gelöscht wird). */
  applyPhoto(data: CvData, photoUrl: string | null): void {
    this.data.set(data);
    this.photoUrl.set(photoUrl);
    this.history.seal();
    this.saver.schedule();
  }

  /** Stellt den Stand vor der letzten Änderung wieder her; das aktuelle Foto bleibt. */
  undo(): void {
    this.restore(this.history.undo(this.data()));
  }

  /** Stellt einen rückgängig gemachten Stand wieder her. */
  redo(): void {
    this.restore(this.history.redo(this.data()));
  }

  /** Schaltet zwischen Muster-Lebenslauf und eigenen Daten um; Design-Einstellungen bleiben dabei erhalten. */
  toggleSample(sample: CvData): void {
    this.dropTranslationUndo();
    this.clearHistory();
    const current = this.data();
    // Zurück zu den eigenen Daten; im Muster geänderte Design-Einstellungen werden übernommen.
    if (this.stash) {
      const { data, photoUrl } = this.stash;
      this.stash = null;
      this.sampleActive.set(false);
      this.show({ ...data, template: current.template }, photoUrl);
      this.saver.schedule();
      return;
    }
    // Ausstehende Änderungen sofort speichern, bevor das Muster das Speichern blockiert.
    if (this.saver.pending) {
      void this.saver.flush();
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
    this.clearHistory();
    this.photoUrl.set(photoUrl);
    this.data.set(data);
    this.error.set(null);
    this.generation.update((value) => value + 1);
    this.saver.schedule();
    if (previous && previous !== data.personal.photoFile) {
      await getCvApi().removePhoto(previous).catch(() => undefined);
    }
  }

  /** Beginnt nach einem schweren Ladefehler mit einem leeren Lebenslauf und speichert ihn sofort. */
  async startEmpty(): Promise<void> {
    this.endSample();
    this.clearHistory();
    this.photoUrl.set(null);
    this.error.set(null);
    this.notice.set(null);
    this.data.set(emptyCv());
    this.persistEnabled = true;
    this.saver.markDirty();
    this.generation.update((value) => value + 1);
    this.phase.set('ready');
    await this.flush();
    await this.refreshLibrary();
  }

  /**
   * „Alle Daten löschen“: entfernt alle gespeicherten Lebensläufe und Fotos. Design und Sprache bleiben,
   * damit die Oberfläche so bleibt, wie die Nutzerin sie eingerichtet hat.
   */
  async deleteAll(): Promise<void> {
    const template = this.data().template;
    await this.runLibrary(async () => {
      this.saver.cancel();
      await getCvApi().resetAll(template);
      await this.openActive();
      this.notice.set(this.ui().dataDeleted);
    });
  }

  /** Öffnet einen anderen gespeicherten Lebenslauf; Änderungen am aktuellen werden vorher gespeichert. */
  async openCv(id: string): Promise<void> {
    if (id === this.library()?.activeId && !this.sampleActive()) {
      return;
    }
    await this.runLibrary(async () => {
      await this.leaveCurrent();
      const data = await getCvApi().switchCv(id);
      await this.showLoaded(data);
    });
  }

  /** Legt einen neuen, leeren Lebenslauf mit dem aktuellen Design an und öffnet ihn. */
  async createCv(name: string): Promise<void> {
    const template = this.data().template;
    await this.runLibrary(async () => {
      await this.leaveCurrent();
      await getCvApi().createCv(name, { ...emptyCv(), template });
      await this.openActive();
      this.notice.set(this.ui().cvCreated);
    });
  }

  /** Kopiert einen gespeicherten Lebenslauf (samt Foto) und öffnet die Kopie. */
  async duplicateCv(id: string, name: string): Promise<void> {
    await this.runLibrary(async () => {
      await this.leaveCurrent();
      await getCvApi().duplicateCv(id, name);
      await this.openActive();
      this.notice.set(this.ui().cvDuplicated);
    });
  }

  /** Benennt einen Lebenslauf um. */
  async renameCv(id: string, name: string): Promise<void> {
    await this.runLibrary(async () => {
      this.library.set(await getCvApi().renameCv(id, name));
    });
  }

  /** Löscht einen Lebenslauf; war er geöffnet, wird der nächste geöffnet. */
  async deleteCv(id: string): Promise<void> {
    await this.runLibrary(async () => {
      const wasActive = id === this.library()?.activeId;
      if (wasActive) {
        this.saver.cancel();
      } else {
        await this.flush();
      }
      const library = await getCvApi().deleteCv(id);
      this.library.set(library);
      if (wasActive) {
        await this.openActive();
      }
      this.notice.set(this.ui().cvDeleted);
    });
  }

  /** Lässt eine Sicherungsdatei auswählen und übernimmt deren Inhalt in den geöffneten Lebenslauf. */
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
      this.history.seal();
      this.history.record(before, Date.now());
      this.history.seal();
      this.syncHistory();
      this.show({ ...translated, template: { ...translated.template, language: to } }, this.photoUrl());
      this.saver.schedule();
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

  /** Stellt den Stand vor der letzten Übersetzung wieder her (Knopf im Hinweisbalken). */
  undoTranslation(): void {
    if (!this.canUndoTranslation()) {
      return;
    }
    this.undo();
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
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.notice.set(null);
    try {
      await this.flush();
      const data = this.data();
      const saved = await getCvApi().exportPdf({
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
      this.notice.set(saved ? this.ui().pdfSaved : null);
    } catch (error) {
      this.error.set(toErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /** Schreibt ausstehende Änderungen sofort; wartet einen laufenden Schreibvorgang ab. Nie im Muster-Modus. */
  flush(): Promise<void> {
    return this.saver.flush();
  }

  /** Lädt beim Start den aktiven Lebenslauf samt Foto und das Verzeichnis. */
  private async init(): Promise<void> {
    try {
      await this.openActive();
      this.phase.set('ready');
    } catch (error) {
      this.fail(error);
    }
  }

  /** Lädt den aktiven Lebenslauf und das Verzeichnis neu. */
  private async openActive(): Promise<void> {
    const data = await getCvApi().load();
    await this.showLoaded(data);
  }

  /** Zeigt frisch geladene Daten an; ein Verweis auf ein fehlendes Foto wird entfernt und gespeichert. */
  private async showLoaded(loaded: CvData): Promise<void> {
    let data = loaded;
    let photoUrl: string | null = null;
    let cleaned = false;
    if (data.personal.photoFile) {
      photoUrl = await getCvApi().readPhoto(data.personal.photoFile);
      if (!photoUrl) {
        data = { ...data, personal: { ...data.personal, photoFile: '' } };
        cleaned = true;
      }
    }
    this.endSample();
    this.clearHistory();
    this.persistEnabled = true;
    this.show(data, photoUrl);
    this.saveState.set('idle');
    if (cleaned) {
      this.saver.markDirty();
      await this.flush();
    }
    await this.refreshLibrary();
  }

  /** Lädt das Verzeichnis; Fehler blenden nur die Liste aus. */
  private async refreshLibrary(): Promise<void> {
    try {
      this.library.set(await getCvApi().library());
    } catch (error) {
      console.error(error);
    }
  }

  /** Vor dem Wechsel: Muster verlassen (die eigenen Daten zurückholen) und ausstehende Änderungen speichern. */
  private async leaveCurrent(): Promise<void> {
    if (this.stash) {
      const { data, photoUrl } = this.stash;
      this.endSample();
      this.show({ ...data, template: this.data().template }, photoUrl);
      this.saver.schedule();
    }
    await this.flush();
  }

  /** Gemeinsamer Ablauf für Aktionen der Lebenslauf-Verwaltung: sperren, Fehler anzeigen. */
  private async runLibrary(action: () => Promise<void>): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.notice.set(null);
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(toErrorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  /** Übernimmt einen Stand aus dem Verlauf; das Foto bleibt das aktuelle, weil alte Fotodateien gelöscht sind. */
  private restore(snapshot: CvData | null): void {
    if (!snapshot) {
      return;
    }
    const current = this.data();
    this.dropTranslationUndo();
    this.syncHistory();
    this.show({ ...snapshot, personal: { ...snapshot.personal, photoFile: current.personal.photoFile } }, this.photoUrl());
    this.saver.schedule();
  }

  /** Zeigt komplett neue Daten an und lässt den Editor seine Formulare neu aufbauen. */
  private show(data: CvData, photoUrl: string | null): void {
    this.photoUrl.set(photoUrl);
    this.data.set(data);
    this.error.set(null);
    this.generation.update((value) => value + 1);
  }

  private dropTranslationUndo(): void {
    this.canUndoTranslation.set(false);
  }

  private clearHistory(): void {
    this.history.clear();
    this.dropTranslationUndo();
    this.syncHistory();
  }

  private syncHistory(): void {
    this.canUndo.set(this.history.canUndo);
    this.canRedo.set(this.history.canRedo);
  }

  /** Beendet den Muster-Modus, ohne die eigenen Daten zurückzuholen. */
  private endSample(): void {
    this.stash = null;
    this.sampleActive.set(false);
  }

  /** UI-Texte in der aktuellen Lebenslaufsprache. */
  private ui() {
    return uiText(this.data().template.language);
  }

  /** Wechselt in den schweren Fehlerzustand, in dem der Editor nicht nutzbar ist. */
  private fail(error: unknown): void {
    this.phase.set('fatal');
    this.error.set(toErrorMessage(error));
  }
}

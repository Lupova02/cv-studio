// Verzögertes, serialisiertes Speichern für das automatische Speichern des Editors.
// Ohne Angular-Abhängigkeiten, damit die Logik mit dem Node-Test-Runner geprüft werden kann.

/** Zustand des automatischen Speicherns, wie ihn die Oberfläche anzeigt. */
export type SaveStatus = 'pending' | 'saved' | 'error';

/** Anbindung des Schedulers an die App: Daten lesen, schreiben und Status melden. */
export interface SaveTarget<T> {
  /** `false` = Speichern ist gerade nicht erlaubt (z. B. Muster-Modus oder noch nicht geladen). */
  canSave(): boolean;
  /** Liefert den aktuellen Stand, der geschrieben werden soll. */
  snapshot(): T;
  /** Schreibt den Stand dauerhaft; wirft bei Fehlern. */
  write(value: T): Promise<void>;
  /** Meldet Statuswechsel; bei `error` mit dem aufgetretenen Fehler. */
  status(status: SaveStatus, error?: unknown): void;
}

/**
 * Plant Speichervorgänge mit Verzögerung ein und stellt sicher, dass nie zwei Schreibvorgänge gleichzeitig laufen.
 * `flush()` wartet einen laufenden Schreibvorgang ab und schreibt danach eingegangene Änderungen sofort –
 * wichtig beim Schließen des Fensters oder wenn die App in den Hintergrund geht.
 */
export class SaveScheduler<T> {
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<void> | null = null;

  constructor(
    private readonly target: SaveTarget<T>,
    private readonly delayMs = 400,
  ) {}

  /** `true`, solange Änderungen noch nicht geschrieben sind. */
  get pending(): boolean {
    return this.dirty;
  }

  /** Merkt eine Änderung vor und speichert `delayMs` nach der letzten Änderung. */
  schedule(): void {
    if (!this.target.canSave()) {
      return;
    }
    this.dirty = true;
    this.target.status('pending');
    this.restartTimer();
  }

  /** Verwirft eine vorgemerkte, noch nicht begonnene Speicherung. */
  cancel(): void {
    this.clearTimer();
    this.dirty = false;
  }

  /** Markiert den Stand als ungespeichert, ohne einen Timer zu starten (z. B. vor einem sofortigen `flush`). */
  markDirty(): void {
    this.dirty = true;
  }

  /** Schreibt ausstehende Änderungen sofort; wartet dabei einen bereits laufenden Schreibvorgang ab. */
  async flush(): Promise<void> {
    this.clearTimer();
    // Läuft schon ein Schreibvorgang, erst dessen Ende abwarten; danach eingegangene Änderungen folgen direkt.
    while (this.running) {
      await this.running;
    }
    if (!this.dirty || !this.target.canSave()) {
      return;
    }
    this.clearTimer();
    this.running = this.writeOnce();
    try {
      await this.running;
    } finally {
      this.running = null;
    }
  }

  private async writeOnce(): Promise<void> {
    this.dirty = false;
    const snapshot = this.target.snapshot();
    this.target.status('pending');
    try {
      await this.target.write(snapshot);
      // Während des Schreibens kann schon die nächste Änderung eingegangen sein; dann bleibt der Status „speichert“.
      if (!this.dirty) {
        this.target.status('saved');
      }
    } catch (error) {
      this.dirty = true;
      this.target.status('error', error);
    }
    // Während des Schreibens eingegangene Änderungen (oder ein Fehlschlag) lösen einen neuen Versuch aus.
    if (this.dirty && !this.timer) {
      this.restartTimer();
    }
  }

  private restartTimer(): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.delayMs);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

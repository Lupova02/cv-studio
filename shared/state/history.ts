// Verlauf für Rückgängig/Wiederholen im Editor. Speichert unveränderliche Zustände (Schnappschüsse);
// schnell aufeinanderfolgende Änderungen (z. B. Tippen eines Wortes) werden zu einem Schritt zusammengefasst.

/** Rückgängig-/Wiederholen-Stapel für unveränderliche Werte. */
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];
  private lastRecord = Number.NEGATIVE_INFINITY;

  constructor(
    /** Höchstzahl gemerkter Schritte; die ältesten fallen heraus. */
    private readonly limit = 100,
    /** Änderungen innerhalb dieses Abstands (ms) zur vorherigen bilden einen gemeinsamen Schritt. */
    private readonly mergeWindow = 1000,
  ) {}

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Merkt den Stand *vor* einer Änderung. Liegt die letzte Änderung weniger als `mergeWindow` zurück,
   * gehört sie zum selben Schritt und es wird nichts gemerkt. Jede neue Änderung verwirft „Wiederholen“.
   */
  record(previous: T, now: number): void {
    this.future = [];
    const merge = now - this.lastRecord < this.mergeWindow && this.past.length > 0;
    this.lastRecord = now;
    if (merge) {
      return;
    }
    this.past.push(previous);
    if (this.past.length > this.limit) {
      this.past.shift();
    }
  }

  /** Beendet den laufenden Schritt, damit die nächste Änderung sicher ein eigener Schritt wird. */
  seal(): void {
    this.lastRecord = Number.NEGATIVE_INFINITY;
  }

  /** Liefert den vorherigen Stand (oder `null`) und merkt `current` für „Wiederholen“. */
  undo(current: T): T | null {
    const previous = this.past.pop();
    if (previous === undefined) {
      return null;
    }
    this.future.push(current);
    this.seal();
    return previous;
  }

  /** Liefert den zuletzt rückgängig gemachten Stand (oder `null`) und merkt `current` für „Rückgängig“. */
  redo(current: T): T | null {
    const next = this.future.pop();
    if (next === undefined) {
      return null;
    }
    this.past.push(current);
    this.seal();
    return next;
  }

  /** Vergisst den kompletten Verlauf (z. B. beim Wechsel zu einem anderen Lebenslauf). */
  clear(): void {
    this.past = [];
    this.future = [];
    this.seal();
  }
}

import { Injectable, effect, type Signal } from '@angular/core';

/**
 * Stapel der offenen Overlays (Bottom Sheets, Menüs, Dialoge) für die Android-Zurück-Taste:
 * Das zuletzt geöffnete schließt zuerst. Overlays melden sich beim Öffnen an und beim Schließen ab.
 */
@Injectable({ providedIn: 'root' })
export class BackStack {
  private readonly entries: (() => void)[] = [];

  /** Meldet ein Overlay mit seiner Schließen-Funktion an; liefert die Abmeldung. */
  push(close: () => void): () => void {
    this.entries.push(close);
    return () => {
      const index = this.entries.lastIndexOf(close);
      if (index >= 0) {
        this.entries.splice(index, 1);
      }
    };
  }

  /** Meldet ein Overlay an, solange `open()` wahr ist (in einem Injection-Kontext aufrufen). */
  track(open: Signal<boolean>, close: () => void): void {
    effect((onCleanup) => {
      if (open()) {
        onCleanup(this.push(close));
      }
    });
  }

  /** Schließt das oberste Overlay; `false`, wenn keines offen ist. */
  closeTop(): boolean {
    const close = this.entries.pop();
    if (!close) {
      return false;
    }
    close();
    return true;
  }
}

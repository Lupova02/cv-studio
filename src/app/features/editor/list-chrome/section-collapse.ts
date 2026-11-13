import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'cv-studio.closed-sections';

/** Merkt, welche Editor-Abschnitte zugeklappt sind (in localStorage, Fehler werden ignoriert). */
@Injectable({ providedIn: 'root' })
export class SectionCollapse {
  private readonly closed = signal<ReadonlySet<string>>(SectionCollapse.read());

  isOpen(section: string): boolean {
    return !this.closed().has(section);
  }

  toggle(section: string): void {
    this.set(section, !this.isOpen(section));
  }

  /** Klappt einen Abschnitt auf (z. B. beim Sprung aus dem Qualitätscheck). */
  open(section: string): void {
    this.set(section, true);
  }

  private set(section: string, open: boolean): void {
    const next = new Set(this.closed());
    if (open) {
      next.delete(section);
    } else {
      next.add(section);
    }
    this.closed.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // Ohne Speicher bleibt der Zustand nur bis zum Neustart erhalten.
    }
  }

  private static read(): ReadonlySet<string> {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
    } catch {
      return new Set();
    }
  }
}

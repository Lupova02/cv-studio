import { Injectable, computed, effect, signal } from '@angular/core';
import { setSystemBarsDark } from '../native/native-bridge';

/** Farbschema der Oberfläche: dem System folgen oder fest hell/dunkel. */
export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'cv-studio.theme';
const MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

/**
 * Hält das gewählte Farbschema und setzt es als `data-theme` am <html>-Element (bei „System“ ohne Attribut,
 * dann entscheidet `prefers-color-scheme`). Die Wahl wird in localStorage gemerkt.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(ThemeService.read());
  /** Ob das System gerade dunkel ist (für „System“). */
  private readonly systemDark = signal(false);
  /** Tatsächlich angezeigtes Schema. */
  readonly dark = computed(() => (this.mode() === 'system' ? this.systemDark() : this.mode() === 'dark'));

  constructor() {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemDark.set(media.matches);
    media.addEventListener('change', () => this.systemDark.set(media.matches));
    // Statusleiste (Mobile) und Browserleiste passend zum Schema färben.
    effect(() => {
      const dark = this.dark();
      setSystemBarsDark(dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#13161c' : '#ffffff');
    });
    effect(() => {
      const mode = this.mode();
      const root = document.documentElement;
      if (mode === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', mode);
      }
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // Ohne Speicher gilt die Wahl nur bis zum Neustart.
      }
    });
  }

  /** Wechselt reihum: System → Hell → Dunkel → System. */
  cycle(): void {
    const index = MODES.indexOf(this.mode());
    this.mode.set(MODES[(index + 1) % MODES.length] ?? 'system');
  }

  private static read(): ThemeMode {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return MODES.includes(value as ThemeMode) ? (value as ThemeMode) : 'system';
    } catch {
      return 'system';
    }
  }
}

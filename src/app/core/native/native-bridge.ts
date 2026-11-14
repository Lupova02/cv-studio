// Dünne Brücke zu nativen Funktionen der Mobile-App (Capacitor). Alle Aufrufe sind ohne Wirkung im Browser
// und in Electron und schlagen nie fehl: Fehlt ein natives Plugin, greift ein Web-Rückfall oder nichts passiert.
// App (Zurück-Taste) und Haptics werden über `registerPlugin` angesprochen; nativ verfügbar sind sie,
// sobald `@capacitor/app` bzw. `@capacitor/haptics` installiert und per `cap sync` übernommen sind.
import { Capacitor, SystemBars, SystemBarsStyle, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/** Ausschnitt der API von `@capacitor/app`, der hier gebraucht wird. */
interface AppPlugin {
  addListener(event: 'backButton', listener: (state: { canGoBack: boolean }) => void): Promise<PluginListenerHandle>;
  exitApp(): Promise<void>;
}

/** Ausschnitt der API von `@capacitor/haptics`. */
interface HapticsPlugin {
  impact(options: { style: 'LIGHT' | 'MEDIUM' | 'HEAVY' }): Promise<void>;
  notification(options: { type: 'SUCCESS' | 'WARNING' | 'ERROR' }): Promise<void>;
}

const App = registerPlugin<AppPlugin>('App');
const Haptics = registerPlugin<HapticsPlugin>('Haptics');

/** Läuft die Oberfläche in der Android- bzw. iOS-App? */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Ob die Nutzerin „Bewegung reduzieren“ eingestellt hat (dann auch kein Vibrieren). */
function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hört auf die Android-Zurück-Taste. Ohne `@capacitor/app` (oder nicht unter Android) passiert nichts,
 * dann bleibt das Standardverhalten des Systems. Liefert eine Abmeldung.
 */
export function onBackButton(handler: () => void): () => void {
  if (Capacitor.getPlatform() !== 'android' || !Capacitor.isPluginAvailable('App')) {
    return () => undefined;
  }
  const handle = App.addListener('backButton', () => handler()).catch(() => null);
  return () => void handle.then((value) => value?.remove());
}

/** Beendet die App (Android); sonst ohne Wirkung. */
export function exitApp(): void {
  if (Capacitor.isPluginAvailable('App')) {
    void App.exitApp().catch(() => undefined);
  }
}

/** Dezentes haptisches Feedback, z. B. beim Löschen (`warning`) oder Verschieben (`light`). */
export function haptic(kind: 'light' | 'warning'): void {
  if (!isNative() || reducedMotion()) {
    return;
  }
  if (Capacitor.isPluginAvailable('Haptics')) {
    const call = kind === 'warning' ? Haptics.notification({ type: 'WARNING' }) : Haptics.impact({ style: 'LIGHT' });
    void call.catch(() => undefined);
    return;
  }
  // Rückfall ohne Plugin (nur Android-WebView unterstützt das).
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(kind === 'warning' ? 18 : 8);
  }
}

/** Ob die App unter die Statusleiste zeichnet (iOS, Android edge-to-edge): dann ist `safe-area-inset-top` > 0. */
function drawsBehindStatusBar(): boolean {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top)';
  document.body.appendChild(probe);
  const inset = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return inset > 0;
}

/**
 * Passt die Symbole der Statusleiste an das Farbschema der App an (helle Symbole auf dunkler App) – aber nur,
 * wenn die App unter der Leiste liegt. Sonst liegt dort der Fensterhintergrund, der dem System-Schema folgt,
 * und der System-Standard bleibt am besten lesbar.
 */
export function setSystemBarsDark(dark: boolean): void {
  if (!isNative()) {
    return;
  }
  const style = !drawsBehindStatusBar() ? SystemBarsStyle.Default : dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
  void SystemBars.setStyle({ style }).catch(() => undefined);
}

/**
 * Hält Eingabefelder über der Bildschirmtastatur: Die Höhe der Tastatur (aus `visualViewport`) wird als
 * `--keyboard-inset` am <html> gesetzt, damit scrollbare Bereiche unten genug Platz haben, und das fokussierte
 * Feld wird nach dem Einblenden der Tastatur in die Mitte gescrollt. Ohne Plugin, auf Android und iOS.
 */
export function keepFieldsAboveKeyboard(): () => void {
  const viewport = window.visualViewport;
  if (!isNative() || !viewport) {
    return () => undefined;
  }
  const root = document.documentElement;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const reveal = () => {
    const field = document.activeElement;
    if (field instanceof HTMLElement && field.matches('input, textarea, select')) {
      const rect = field.getBoundingClientRect();
      if (rect.bottom > viewport.height - 12 || rect.top < 0) {
        field.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }
  };
  const update = () => {
    const inset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
    root.style.setProperty('--keyboard-inset', `${inset}px`);
    if (timer) {
      clearTimeout(timer);
    }
    // Erst nach der Einblend-Animation messen.
    timer = setTimeout(reveal, 120);
  };
  const onFocus = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(reveal, 350);
  };
  viewport.addEventListener('resize', update);
  document.addEventListener('focusin', onFocus);
  update();
  return () => {
    viewport.removeEventListener('resize', update);
    document.removeEventListener('focusin', onFocus);
    if (timer) {
      clearTimeout(timer);
    }
  };
}

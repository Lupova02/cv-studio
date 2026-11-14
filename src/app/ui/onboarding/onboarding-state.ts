// Merkt, ob der Einstieg beim ersten Start schon gezeigt wurde (getrennt von der Komponente, die erst bei Bedarf lädt).
const STORAGE_KEY = 'cv-studio.onboarded';

/** Ob der Einstieg schon gezeigt (oder übersprungen) wurde. */
export function onboardingSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

/** Merkt, dass der Einstieg gezeigt wurde (Fehler werden ignoriert). */
export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Ohne Speicher erscheint der Einstieg beim nächsten Start erneut – unschädlich.
  }
}

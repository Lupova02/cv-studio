# CV-Studio

Offline-App zum Erstellen von Lebensläufen für macOS, Windows, Android und iOS, gebaut mit Angular, Electron und Capacitor. Alle Daten bleiben auf dem eigenen Rechner. Die App braucht keinen Server, kein Konto und keine Internetverbindung, auch nicht für die Übersetzung.

## Funktionen

- **Editor mit Live-Vorschau**: Persönliches, „Über mich“, Berufserfahrung, Ausbildung, Kenntnisse, Sprachen, Zertifikate, Projekte und Referenzen. Einträge lassen sich hinzufügen, per Ziehen oder über Pfeile verschieben und über den roten Papierkorb entfernen. Leere Abschnitte erscheinen nicht im Lebenslauf.
- **Mehrere Lebensläufe**: anlegen, umbenennen, duplizieren (samt Foto), löschen und wechseln – z. B. je Bewerbung eine Fassung.
- **Rückgängig/Wiederholen** für den ganzen Lebenslauf (Strg/⌘+Z, Strg/⌘+Umschalt+Z).
- **Qualitätscheck**: Hinweise zu fehlenden Angaben, unstimmigen Zeiträumen und zu langen Texten, mit Sprung zum Abschnitt.
- **Fünf Vorlagen**: Klassisch, Modern, Minimal, Elegant und Banner. Einstellbar sind Akzentfarbe, Schrift, Darstellung der Niveaus (Sterne, Balken oder aus), Datumsposition, Zeitachse, Reihenfolge (eigene oder neueste zuerst) und Seitenzahlen. Das Geschlecht lässt sich im Lebenslauf ausblenden.
- **PDF-Export** im A4-Format mit sauberem Seitenumbruch.
- **Sicherung als JSON**: Export und Import des kompletten Lebenslaufs inklusive Foto, zum Beispiel für den Umzug auf einen anderen Rechner. Ältere Stände werden beim Import automatisch migriert und geprüft.
- **Drei Sprachen** für Oberfläche und Lebenslauf: Deutsch, Englisch und Türkisch.
- **Offline-Übersetzung** der eigenen Texte zwischen diesen Sprachen, mit Rückgängig.
- **Automatisches Speichern**: Die Lebensläufe bleiben erhalten, bis sie gelöscht oder über „Alle Daten löschen“ entfernt werden.
- **Muster-Lebenslauf** mit erfundenen Daten zum Ausprobieren der Vorlagen. Im Muster-Modus wird nichts gespeichert.
- **Hell- und Dunkelmodus** (folgt dem System oder fest gewählt), Kontraste nach WCAG AA, dezente Animationen (abschaltbar über „Bewegung reduzieren“).
- **Handy und Tablet**: Auf schmalen Bildschirmen sind Bearbeiten, Design und Vorschau Tabs; Bedienelemente sind touch-tauglich.
- **Vorschau-Zoom**: Pinch, Doppeltipp (Breite ↔ 100 %), +/− und Strg/⌘ + Mausrad, mit Seitenanzeige „Seite 1 von 3“.
- **Schnellnavigation** mit Ausfüllstand je Abschnitt, **Akzentfarben-Vorgaben** (alle gut lesbar mit weißer Schrift) und **Foto-Zuschnitt** im Seitenverhältnis der Vorlage (Mobile: Kamera oder Galerie).
- **Tastenkürzel und Menüleiste** (Desktop): Strg/⌘ + S Sicherung, P PDF, O Import, Z/Umschalt+Z Rückgängig/Wiederholen.

## Voraussetzungen

- Node.js 22 oder neuer und npm 10 oder neuer
- macOS oder Windows (Desktop)
- Android Studio mit Android-SDK bzw. Xcode 16 oder neuer (Mobile)
- JDK 21 für den Android-Build (Capacitor 8). Liegt ein älteres Java im `PATH`, vorher `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` setzen, sonst bricht Gradle mit `invalid source release: 21` ab.

## Installation und Start

```bash
npm install
npm start
```

`npm start` lädt beim ersten Mal die Übersetzungsmodelle (siehe unten), startet den Angular-Entwicklungsserver und öffnet die Electron-App.

Zur Entwicklung der Oberfläche reicht auch der Browser:

```bash
npx ng serve --host 127.0.0.1 --port 4200
```

Im Browser speichert die App Daten und Fotos in IndexedDB, und der PDF-Export läuft über den Druckdialog („Als PDF speichern“). Dieser Modus ist nur für die Entwicklung gedacht. Bitte nur einen Tab gleichzeitig öffnen, weil sich alle Tabs denselben Speicher teilen.

## Tests

```bash
npm test
npm run a11y   # Barrierefreiheit mit axe-core (offline in Electron; einmalig: npm i -D playwright-core @axe-core/playwright)
```

Die Tests laufen mit dem eingebauten Test-Runner von Node (`node --test`). Sie decken Datenmodell und Migration, Sicherung, Lebenslauf-Verwaltung, Qualitätscheck, Rückgängig/Speichern, Formatierung, Farbkontraste des Designs, Kataloge und den Vertrag zwischen Electron und Oberfläche ab.

## Build und Pakete

```bash
npm run build      # Oberfläche und Electron-Hauptprozess bauen
npm run dist:mac   # DMG für macOS (Apple Silicon)
npm run dist:win   # NSIS-Installer für Windows x64
```

Die fertigen Pakete landen in `release/`. `dist:win` braucht eine Windows-Umgebung oder einen Cross-Build.

## Mobile-Apps (Android und iOS)

Die Mobile-Apps nutzen [Capacitor](https://capacitorjs.com) 8 und dieselbe Oberfläche. Daten und Fotos liegen als Dateien im privaten App-Ordner; PDF und Sicherung werden über den Teilen-Dialog des Systems ausgegeben (z. B. „In Dateien sichern“). Das PDF erzeugt ein app-eigenes natives Plugin (`CvPrint`, Android: WebView-Druckadapter, iOS: `WKWebView.createPDF`).

```bash
npm run build:mobile   # Oberfläche bauen und in android/ und ios/ übernehmen (cap sync)
npm run android        # auf dem per USB verbundenen Android-Gerät starten (USB-Debugging an)
npm run android:apk    # Debug-APK: android/app/build/outputs/apk/debug/app-debug.apk
npm run ios            # im iOS-Simulator starten; alternativ: npx cap open ios
```

Die Pakete enthalten die Übersetzungsmodelle (rund 110 MB), damit die Übersetzung auch mobil offline funktioniert.

## App-Symbol

```bash
npm run icons          # SVG → assets/, build/icon.png, build/icon.icns, public/favicon.svg, Android- und iOS-Größen
```

Die Zeichnung steht in `scripts/generate-icons.mjs`.

## Datenschutz und Sicherheit

- Die Desktop-App speichert im Benutzerordner der App, zum Beispiel unter macOS in `~/Library/Application Support/CV-Studio`: den ersten Lebenslauf als `cv-data.json`, weitere unter `cvs/`, das Verzeichnis in `library.json` und die Fotos unter `photos/`.
- Die Mobile-Apps speichern im privaten App-Ordner; unter Android sind die Daten von der Cloud-Sicherung ausgenommen.
- Eine strenge Content Security Policy erlaubt nur lokale Ressourcen (`connect-src 'self'`). Die App baut keine Verbindungen ins Internet auf.
- Die Oberfläche hat keinen direkten Zugriff auf Node.js. Sie spricht nur über eine schmale, geprüfte IPC-Schnittstelle mit dem Hauptprozess.

## Übersetzung

Übersetzt werden die eigenen Texte: Positionen, Abschlüsse, Beschreibungen und Stichpunkte. Dafür nutzt die App die Übersetzungs-Engine [Bergamot](https://codeberg.org/mkljczk/bergamot-translator) und die Modelle von [Firefox Translations](https://github.com/mozilla/translations), beide unter der [MPL-2.0](https://www.mozilla.org/MPL/2.0/). Die Übersetzung läuft lokal in einem Web Worker.

Die Modelle (rund 110 MB) liegen nicht im Repository. `npm run models` lädt sie einmalig nach `public/translation/models` und prüft die Prüfsummen. `npm start` und `npm run build` erledigen das automatisch.

## Projektstruktur

```
electron/                 Desktop-Hülle (Hauptprozess)
  main.ts                 Fenster, cvstudio://-Protokoll, App-Start
  preload.ts              sichere Brücke zwischen Electron und Oberfläche
  security.ts             CSP und Fenster-Einstellungen
  ipc/handlers.ts         beantwortet die Anfragen der Oberfläche
  services/               Datei-Dienste: Lebensläufe speichern, Fotos, PDF-Export
shared/                   Code, den Electron und Oberfläche gemeinsam nutzen
  cv/                     Datenmodell, Migration, Lebenslauf-Verwaltung, Qualitätscheck, Übersetzung, Muster, Sicherung
  state/                  Rückgängig-Verlauf und verzögertes Speichern
  ipc/                    Vertrag zwischen Electron und Oberfläche (Kanäle, Typen, Prüfung)
  catalogs/               Länder, Sprachen, Kenntnisse
  format/                 Darstellung von Datum, Adresse, Farbe, Dateinamen
  i18n/                   Texte der Oberfläche und Beschriftungen im Lebenslauf
src/app/                  Angular-Oberfläche
  core/api/               Speichern/Export: Electron-Anbindung, Mobile (Capacitor) oder Browser-Ersatz (IndexedDB)
  core/state/             zentraler Zustand, Farbschema und Texte in der gewählten Sprache
  core/translation/       Offline-Übersetzer (Bergamot im Web Worker)
  features/editor/        Editor-Seite mit Werkzeugleiste, Persönlichem, Design und Vorschau
    form/                 Formular-Aufbau und Hilfen für Listen
    list-chrome/          aufklappbarer Abschnittsrahmen und Knöpfe je Eintrag
    toolbar/              Lebenslauf-Menü und Qualitätscheck
    sections/<abschnitt>/ je Lebenslauf-Abschnitt ein Ordner
  features/print/         Druckseite für den PDF-Export
  templates/              Vorlagen Klassisch, Modern, Minimal, Elegant, Banner
    host/                 Vorschau-Rahmen und Seitenumbruch
  ui/                     kleine wiederverwendbare Bausteine (Sterne, Symbole)
scripts/                  Länderdaten erzeugen, Übersetzungsmodelle laden, App-Symbole erzeugen
assets/                   Quellen des App-Symbols und Splash-Bilder (für @capacitor/assets)
build/                    App-Symbol für die Desktop-Pakete
android/, ios/            native Mobile-Projekte (Capacitor) inkl. Plugin CvPrint
```

## Technik

Angular 22 (Standalone-Komponenten, Signals, Reactive Forms), Electron 44, Capacitor 8, TypeScript 6 und electron-builder.

Änderungen des Redesigns, behobene Fehler und offene Punkte: siehe [CHANGES-REDESIGN.md](CHANGES-REDESIGN.md).

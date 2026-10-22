# CV-Studio

Offline-Desktop-App zum Erstellen von Lebensläufen, gebaut mit Angular und Electron. Alle Daten bleiben auf dem eigenen Rechner. Die App braucht keinen Server, kein Konto und keine Internetverbindung, auch nicht für die Übersetzung.

## Funktionen

- **Editor mit Live-Vorschau**: Persönliches, „Über mich“, Berufserfahrung, Ausbildung, Kenntnisse, Sprachen, Zertifikate, Projekte und Referenzen. Einträge lassen sich hinzufügen, per Ziehen oder über Pfeile verschieben und über den roten Papierkorb entfernen. Leere Abschnitte erscheinen nicht im Lebenslauf.
- **Drei Vorlagen**: Klassisch, Modern und Minimal. Einstellbar sind Akzentfarbe, Schrift, Darstellung der Niveaus (Sterne, Balken oder aus), Datumsposition, Zeitachse, Reihenfolge (eigene oder neueste zuerst) und Seitenzahlen. Das Geschlecht lässt sich im Lebenslauf ausblenden.
- **PDF-Export** im A4-Format mit sauberem Seitenumbruch.
- **Sicherung als JSON**: Export und Import des kompletten Lebenslaufs inklusive Foto, zum Beispiel für den Umzug auf einen anderen Rechner. Ältere Stände werden beim Import automatisch migriert und geprüft.
- **Drei Sprachen** für Oberfläche und Lebenslauf: Deutsch, Englisch und Türkisch.
- **Offline-Übersetzung** der eigenen Texte zwischen diesen Sprachen, mit Rückgängig.
- **Automatisches Speichern**: Der Lebenslauf bleibt erhalten, bis er über „Alle Daten löschen“ entfernt wird.
- **Muster-Lebenslauf** mit erfundenen Daten zum Ausprobieren der Vorlagen. Im Muster-Modus wird nichts gespeichert.

## Voraussetzungen

- Node.js 22 und npm 10
- macOS oder Windows

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
```

Die Tests laufen mit dem eingebauten Test-Runner von Node (`node --test`). Sie decken Datenmodell und Migration, Sicherung, Formatierung, Kataloge und den Vertrag zwischen Electron und Oberfläche ab.

## Build und Pakete

```bash
npm run build      # Oberfläche und Electron-Hauptprozess bauen
npm run dist:mac   # DMG für macOS (Apple Silicon)
npm run dist:win   # NSIS-Installer für Windows x64
```

Die fertigen Pakete landen in `release/`. `dist:win` braucht eine Windows-Umgebung oder einen Cross-Build.

## Datenschutz und Sicherheit

- Die Desktop-App speichert den Lebenslauf als `cv-data.json` und die Fotos im Benutzerordner der App, zum Beispiel unter macOS in `~/Library/Application Support/CV-Studio`.
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
  services/               Datei-Dienste: Lebenslauf speichern, Fotos, PDF-Export
shared/                   Code, den Electron und Oberfläche gemeinsam nutzen
  cv/                     Datenmodell, Migration alter Stände, Übersetzung, Muster, Sicherung
  ipc/                    Vertrag zwischen Electron und Oberfläche (Kanäle, Typen, Prüfung)
  catalogs/               Länder, Sprachen, Kenntnisse
  format/                 Darstellung von Datum, Adresse, Farbe, Dateinamen
  i18n/                   Texte der Oberfläche und Beschriftungen im Lebenslauf
src/app/                  Angular-Oberfläche
  core/api/               Speichern/Export: Electron-Anbindung oder Browser-Ersatz (IndexedDB)
  core/state/             zentraler Zustand und Texte in der gewählten Sprache
  core/translation/       Offline-Übersetzer (Bergamot im Web Worker)
  features/editor/        Editor-Seite mit Werkzeugleiste, Persönlichem, Design und Vorschau
    form/                 Formular-Aufbau und Hilfen für Listen
    list-chrome/          Listen-Kopf und Knöpfe je Eintrag
    sections/<abschnitt>/ je Lebenslauf-Abschnitt ein Ordner
  features/print/         Druckseite für den PDF-Export
  templates/              Vorlagen Klassisch, Modern, Minimal
    host/                 Vorschau-Rahmen und Seitenumbruch
  ui/                     kleine wiederverwendbare Bausteine (Sterne, Symbole)
scripts/                  Länderdaten erzeugen, Übersetzungsmodelle laden
build/                    App-Symbol für die Pakete
```

## Technik

Angular 22 (Standalone-Komponenten, Signals, Reactive Forms), Electron 44, TypeScript 6 und electron-builder.

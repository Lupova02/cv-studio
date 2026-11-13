# Redesign – Änderungen, Fixes, offene Punkte

Branch: `redesign` (basiert auf `main` @ `aacf13c`). `main` ist unverändert.

## Was geändert wurde

### Design & UX
- **Design-Tokens** (CSS-Variablen in `src/styles.scss`) für Flächen, Text, Akzent, Status, Radien, Schatten und Bewegung.
- **Hell-/Dunkelmodus**: folgt standardmäßig dem System; über den Knopf in der Werkzeugleiste umschaltbar (System → Hell → Dunkel, gemerkt in `localStorage`). Das Lebenslauf-Blatt bleibt immer weißes Papier, die Druckansicht ist unabhängig vom Farbschema.
- **Kontraste nach WCAG AA**: Alle Text-/Hintergrund-Paare beider Schemata werden per Test nachgerechnet (`shared/format/theme-contrast.test.ts`).
- **Animationen**: Abschnitte klappen weich auf/zu, Drag & Drop mit Platz-Animation, Vorlagenwechsel blendet das Blatt neu ein, Toasts gleiten ein/aus, Popover öffnen mit kurzer Skalierung. `prefers-reduced-motion` schaltet alles praktisch ab.
- **Responsives Layout**: Unter 900 px Breite werden Editor und Vorschau zu Tabs (Bearbeiten · Design · Vorschau) mit Tab-Leiste unten; Safe-Area-Ränder (Notch) werden berücksichtigt. Touch-Geräte bekommen 44-px-Bedienelemente und 16-px-Schrift in Feldern (kein Zoom auf iOS).
- **Aufklappbare Abschnitte** mit Eintragszähler; zugeklappte Inhalte sind `inert` (nicht per Tab/Screenreader erreichbar). Der Zustand wird gemerkt.
- **Hinweise als Toasts** statt Balken (Fehler bleiben bis zum Schließen, Hinweise verschwinden nach einigen Sekunden).
- Neues **App-Symbol** auch im Kopf der App.

### Neue Funktionen
- **Mehrere Lebensläufe**: Auswahl oben links – anlegen, öffnen, umbenennen (direkt in der Liste), duplizieren (inkl. eigener Fotokopie), löschen. Der erste Lebenslauf bleibt in `cv-data.json` (abwärtskompatibel), weitere liegen in `cvs/<id>.json`, das Verzeichnis in `library.json`.
- **Rückgängig/Wiederholen** für den ganzen Lebenslauf (Knöpfe und Strg/⌘+Z, Strg/⌘+Umschalt+Z, Strg+Y). Schnelles Tippen wird zu einem Schritt zusammengefasst; die Übersetzung ist ein eigener Schritt.
- **Qualitätscheck** mit Zähler: fehlende Angaben (Name, E-Mail, Telefon, Foto, Über mich, Abschnitte, Sprachniveau), unstimmige Zeiträume (Ende vor Beginn, Beginn in der Zukunft), fehlende Titel, leere/lange Stichpunkte, lange Texte und mehr als zwei Seiten. Klick auf einen Hinweis springt zum Abschnitt. Zeichenzähler bei „Über mich“.
- **Zwei neue Vorlagen**: *Elegant* (zentrierter Kopf, rundes Foto, mittige Abschnittstitel) und *Banner* (Kopfband in der Akzentfarbe mit automatisch lesbarer Schriftfarbe). Beide nutzen das erprobte Markup inkl. Seitenumbruch und Zeitleiste.
- Vorlagen-Miniaturen zeigen die gewählte Akzentfarbe.

### Mobile-Apps (Capacitor 8.6.2)
- `android/` und `ios/` (Swift Package Manager) erzeugt, App-ID `app.cvstudio.mobile`.
- **Speicher**: JSON-Dateien im privaten App-Ordner über `@capacitor/filesystem` (`Directory.Data/cv-studio/…`), geschrieben über Temp-Datei + Umbenennen. Lesefehler vorhandener Dateien werden nicht als „leer“ gewertet (kein versehentliches Überschreiben).
- **PDF**: app-eigenes natives Plugin `CvPrint` – Android über den WebView-Druckadapter direkt in eine Datei (Rückfall: System-Druckdialog), iOS über `WKWebView.createPDF`, danach als Vektorgrafik in A4-Seiten zerlegt. Anschließend Teilen-Dialog (`@capacitor/share`).
- **Sicherung (JSON)**: wird erzeugt und über den Teilen-Dialog angeboten (z. B. „In Dateien sichern“); Import über die Dateiauswahl.
- Beim Wechsel in den Hintergrund wird sofort gespeichert.
- Android: keine Cloud-Sicherung/Geräteübertragung der App-Daten (`allowBackup=false`, `data_extraction_rules.xml`).
- Gemeinsame Web-Umsetzung `src/app/core/api/web-cv-api.ts` für Browser (IndexedDB) und Mobile.

### Icon
- `scripts/generate-icons.mjs` (`npm run icons`) erzeugt aus einer SVG-Zeichnung: `assets/` (Quellen für `@capacitor/assets`: Android adaptiv + iOS + Splash hell/dunkel), `build/icon.png`, `build/icon.icns` (ohne `iconutil`, direkt geschrieben) und `public/favicon.svg`.

### Mobile-Feinschliff (iPhone-Breite ~390 px)
- **Werkzeugleiste**: schmal nur noch Logo, Lebenslauf-Auswahl, Rückgängig/Wiederholen, Qualitätscheck, PDF und „⋯“. Kompaktere Knöpfe; vorher konnte die Lebenslauf-Auswahl unter Rückgängig/Wiederholen rutschen (die Leiste war breiter als der Bildschirm).
- **„⋯“-Menü als Bottom Sheet** (`src/app/ui/bottom-sheet/`): Darstellung (System/Hell/Dunkel), Muster-Schalter mit Beschriftung, Sprache, Übersetzen, Sicherung importieren/exportieren, „Alle Daten löschen“ mit eigener Rückfrage im Sheet, Versionszeile. Die Editor-Leiste gibt es nur noch auf breiten Bildschirmen.
- **Datumsfelder** (`date`/`month`): volle Breite, schrumpfbar, `appearance: none` – liefen auf iOS rechts über den Rand.
- **Design-Tab**: nur die Einstellungen, voll scrollbar; die Vorschau gibt es nur im Vorschau-Tab. Überschriften (Vorlage, Akzentfarbe, Niveau, Datum …) einheitlich und oben bündig; die Vorlagen-Auswahl hat jetzt eine Überschrift.
- **Hinweiszähler**: Qualitätscheck und Vorschau-Tab zeigen dieselbe Zahl aus derselben Quelle (`hints()`) in derselben Farbe. Vorher zeigte der Tab die Seitenzahl, und im Bearbeiten-Tab war die Vorschau ausgeblendet (`display: none`) – dadurch rechnete die Seitenzählung mit 1 Seite und der Qualitätscheck zeigte je nach Tab unterschiedlich viele Hinweise. Die Vorschau läuft jetzt unsichtbar mit.
- **Safe Areas**: Seitenränder von Editor, Design-Tab und Vorschau sowie die Position der Menüs berücksichtigen `env(safe-area-inset-*)`; Bottom Sheet mit Abstand zur Home-Leiste.
- Desktop: Muster-Schalter behält seine Beschriftung auch bei mittlerer Fensterbreite.

## Gefundene Bugs und Fixes

| Bug | Fix | Test |
| --- | --- | --- |
| Beim Schließen während eines laufenden Speichervorgangs kehrte `flush()` sofort zurück – die letzten Eingaben gingen verloren. | `SaveScheduler` wartet laufende Schreibvorgänge ab und schreibt danach Eingegangenes sofort. | `shared/state/save-scheduler.test.ts` |
| Browser/Mobile speicherten beim Verlassen der App nicht (kein Schließ-Hook). | Speichern bei `visibilitychange`/`pagehide`. | – (UI) |
| `onAccentColor` wählte z. B. auf Orange (#ff8c00) weiße Schrift (Kontrast 2,4:1) in der Seitenleiste „Modern“. | Auswahl nach echtem WCAG-Kontrast. | `format.test.ts` (inkl. Farbraum-Stichprobe ≥ 3:1) |
| PDF-Dateiname ohne Namen hieß immer „Lebenslauf“, auch auf Englisch/Türkisch. | `CV` bzw. `Ozgecmis` je Sprache. | `format.test.ts` |
| Kenntnisse: Ein Klick löste pro gewählter Kenntnis eine eigene Änderung (und Speicherung) aus. | Neuaufbau ohne Zwischenereignisse, eine Änderung am Ende. | – (UI) |
| Sicherungs-Import ohne eingebettetes Foto verwies auf ein vorhandenes Foto – mit mehreren Lebensläufen hätte Löschen des einen das Foto des anderen entfernt. | Wiederverwendete Fotos werden als Kopie abgelegt. | `cv-library.test.ts` (Duplizieren/Löschen) |
| Bedienhilfe: Sterne im Editor ohne Gruppenname/Zustand; Entfernen-Knopf und Niveau bei Sprachen ohne eindeutigen Namen. | `role=group` + Name, `aria-pressed`; Namen mit Sprache. | – |
| `npm run build` brach in der Sandbox mit „Abort trap: 6“ ab. | Ursache: der persistente Angular-Cache (lmdb) – nur in der Sandbox; mit `CI=1` (Cache aus) läuft der Build ohne Warnungen. Lokal ist das kein Problem. | – |

## Offene Punkte (bitte prüfen)

Meine Umgebung (Sandbox + deine globalen Regeln) hat einige Schritte verhindert:

1. **Commits/Push**: `git commit` steht in `~/.claude/settings.json` auf *deny*. Alle Änderungen sind vorgemerkt (`git add`), aber **nicht committet**. Befehle siehe unten.
2. **Android-Build/Start auf dem Handy** nicht ausgeführt: Das Android-SDK liegt unter `~/Library` (Lesen gesperrt), Gradle braucht `~/.gradle`, `adb` darf keinen Port öffnen. Der Java-Code des Plugins ist daher **nicht kompiliert** worden.
3. **iOS-Simulator-Build** nicht ausgeführt (Swift-Paket-Cache und Simulator-Dienste unter `~/Library` gesperrt). `CvPrintPlugin.swift` ist syntaktisch geprüft, aber nicht gegen das SDK kompiliert.
4. **macOS**: `.app` wurde mit electron-builder gebaut und geprüft (Icon, Bundle-ID, Inhalt); nur der **DMG-Schritt** scheiterte an `hdiutil` in der Sandbox.
5. **Sichtprüfung der Oberfläche** war nicht möglich (kein lokaler Port, Electron startet in der Sandbox nicht, Playwright ohne Chrome). Bitte Hell/Dunkel, Handy-Breite und die Popover einmal ansehen.
6. Android-PDF: Die direkte Dateierzeugung nutzt eine verbreitete Technik (Klasse im Paket `android.print`). Falls ein Gerät sie blockiert, öffnet sich automatisch der System-Druckdialog („Als PDF speichern“).
7. Das APK/IPA enthält die Übersetzungsmodelle (~110 MB), damit die Übersetzung offline funktioniert.
8. Prüfmeldungen aus `migrate` (z. B. bei beschädigter Datei beim Start) sind weiterhin nur deutsch; beim Import werden sie für EN/TR durch eine allgemeine Meldung ersetzt (wie bisher).
9. Optionaler Anschreiben-Editor wurde nicht umgesetzt (zugunsten der übrigen Punkte).
10. `npm audit` meldet Schwachstellen in Entwicklungs-Abhängigkeiten (u. a. `zod` über `@angular/forms`, ohne verfügbaren Fix); nichts davon wird in die App ausgeliefert, die Laufzeit bleibt offline mit strenger CSP.

## So testest du es

```bash
git switch redesign
npm install
npm test                 # 79 Tests
npm start                # Desktop (Electron) mit Dev-Server
npm run dist:mac         # DMG unter release/
```

Checkliste Desktop:
- Werkzeugleiste: Lebenslauf-Menü → „Neuer Lebenslauf“, umbenennen, duplizieren (mit Foto), löschen, zwischen Lebensläufen wechseln. Alte Daten aus `cv-data.json` sind als erster Eintrag da.
- Etwas tippen → Strg/⌘+Z / Umschalt+Strg/⌘+Z; Knöpfe ↶ ↷.
- Qualitätscheck öffnen, Hinweis anklicken → Sprung zum Abschnitt.
- Farbschema-Knopf (System/Hell/Dunkel); Systemeinstellung „Bewegung reduzieren“ testen.
- Vorlagen „Elegant“ und „Banner“ mit hellen und dunklen Akzentfarben, PDF exportieren (mehrseitig).
- Fenster schmal ziehen (Browser-Modus: `npx ng serve` und unter 900 px) → Tabs.

Android (Handy per USB, USB-Debugging an):
```bash
npm run android          # baut, synchronisiert und startet auf dem Gerät
npm run android:apk      # Debug-APK: android/app/build/outputs/apk/debug/app-debug.apk
```

iOS (Simulator):
```bash
npm run ios              # oder: npm run build:mobile && npx cap open ios → in Xcode Simulator wählen, ▶︎
```

Mobile-Checkliste: Foto wählen, PDF → Teilen-Dialog, Sicherung exportieren/importieren, App in den Hintergrund schicken und beenden → Daten sind da.

## Commits (von dir auszuführen)

Alle Änderungen sind vorgemerkt. Vorschlag (ein Commit, da sich die Dateien überschneiden):

```bash
git switch redesign
git add -A
git commit -m "feat: Redesign mit Dunkelmodus, mehreren Lebensläufen, Qualitätscheck und Mobile-Apps" \
  -m "Design-Tokens, Hell/Dunkel, responsives Tab-Layout, Animationen; Rückgängig/Wiederholen; zwei neue Vorlagen; Capacitor 8 für Android/iOS mit PDF und Teilen; neues App-Symbol; Bugfixes siehe CHANGES-REDESIGN.md" \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin redesign
```

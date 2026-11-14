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

### Geräte-Test (iOS-Simulator iPhone 18 Pro, OnePlus per USB)
Beide Apps gebaut, installiert und in Hell/Dunkel durchgesehen; Screenshots in `docs/screenshots/` (`ios-*`, `android-*`). PDF-Export auf beiden Geräten geprüft (natives Plugin → Teilen-Dialog, 3 Seiten A4). Dabei gefunden und behoben:
- **Android: falsche Seitenumbrüche in Vorschau und PDF** – große Lücken am Seitenanfang und mitten auf der Seite. Ursache: Bei „Bewegung reduzieren“ (auf dem Gerät: Animationen aus) setzte die globale Regel `transition-duration: 1ms` auf *alle* Elemente; dadurch bekam jeder Abstandshalter einen Übergang, `paginate()` maß synchron die alte Höhe und addierte die Korrektur dreimal. Jetzt `0s` (keine Übergänge) und die Abstandshalter selbst mit `transition: none`. Test: `theme-contrast.test.ts`.
- **iOS: Seite verschob sich beim Scrollen zu einem Feld** um ~55 px samt Werkzeugleiste. Ursache: Screenreader-Beschriftungen (`.sr`, absolut positioniert) hatten keinen positionierten Vorfahren und verlängerten das Dokument. Shell und Editor sind jetzt Bezugsrahmen, das Dokument selbst scrollt nicht mehr.
- **Lebenslauf-Name in der Werkzeugleiste** war bei 384 px auf „Mein …“ gekürzt: Der Hinweiszähler sitzt schmal jetzt als Badge am Qualitätscheck-Symbol.
- Tab-Markierung liegt innerhalb der Tab-Leiste statt auf der Kante zum Inhalt.
- Android-Build: braucht JDK 21 (siehe README).
- Erwartete Konsolenmeldungen auf iOS: `OS-PLUG-FILE-0008 … does not exist` beim ersten Start – das ist die Existenzprüfung vor dem Lesen, kein Fehler.

## Runde 3 – Feinschliff (14.11.2026)

### Umgesetzt
**A. Fehler aus dem Screenshot-Review**
1. **Qualitätscheck auf Mobile** öffnete sich zwar, lag aber als halbtransparentes Popover über der Vorschau (daher wirkte Screenshot 08 wie die Vorschau). Jetzt **Bottom Sheet**; jeder Hinweis kennt sein Zielfeld (`QualityHint.target`: Feld, Eintrag, Stichpunkt). Ein Tipp wechselt in den Bearbeiten-Tab, klappt den Abschnitt auf, scrollt zum Feld und setzt den Fokus. Auf dem OnePlus geprüft.
2. **Lösch-Rückfrage**: eigener Sheet-Titel „Alle Daten löschen?“, Fokus auf „Abbrechen“, roter Knopf über neue Tokens `--danger-solid`/`--on-danger` (hell 6,6:1, dunkel 4,9:1; per Kontrast-Test abgesichert).
3. **Muster-Modus sichtbar**: Banner „Muster – Änderungen werden nicht gespeichert“ mit „Muster beenden“; die Lebenslauf-Auswahl zeigt „Muster“.
4. **Einheitliches Formular-Raster**: ein Token `--field-gap` (0,75 rem) für alle Feldgruppen (vorher 0,15 rem zwischen Vor- und Nachname, 0,7 rem darunter).
5. **Lebenslauf-Liste**: „Bearbeitet vor 5 Min.“ bzw. „gestern“ in eigener Zeile (`relativeTime`, getestet), volles Datum als Tooltip; Löschen beim letzten Lebenslauf gesperrt, mit Hinweis.
6. **Android-Zurück-Taste**: Reihenfolge Sheet/Menü → Bearbeiten-Tab → App verlassen (`BackStack` + `onBackButton`). **Braucht `@capacitor/app`** (siehe offene Punkte); ohne das Paket schließt Android weiter die App (auf dem Gerät bestätigt).

**B. Verbesserungen**
7. **Vorschau-Zoom**: Pinch (Touch-Ereignisse), Doppeltipp (Breite ↔ 100 %), +/−-Knöpfe, Strg/⌘ + Mausrad; Anzeige „Seite 1 von 3“ für die Seite in der Bildmitte.
8. **8 Akzentfarben-Vorgaben** (Standardblau zuerst), alle ≥ 4,5:1 für weiße Schrift (Test in `format.test.ts`); daneben weiterhin der freie Farbwähler.
9. **Schnellnavigation** im Bearbeiten-Tab: waagerecht scrollbare Chips je Abschnitt mit Ausfüllstand (leer/angefangen/fertig, `shared/cv/cv-progress.ts`, getestet); auf dem Handy klebt sie oben.
10. **Natives Gefühl**: Statusleisten-Stil über das in Capacitor 8 eingebaute `SystemBars` (kein Zusatzpaket) – nur, wenn die App unter der Leiste liegt (iOS); sonst bleibt der lesbare System-Standard (auf dem OnePlus mit „System dunkel + App hell“ geprüft). Haptik beim Löschen/Verschieben (`@capacitor/haptics`, falls installiert; sonst `navigator.vibrate` auf Android; aus bei „Bewegung reduzieren“). Tastatur: `visualViewport` hält das fokussierte Feld sichtbar und gibt unten Platz; die Tab-Leiste blendet sich beim Tippen aus. Splash: der native Start-Bildschirm hell/dunkel war schon vorhanden.
11. **Foto**: auf dem Handy Auswahl „Foto aufnehmen“ (Frontkamera über `<input capture>`) oder „Aus Galerie wählen“, danach **Zuschnitt-Dialog** im Seitenverhältnis der Vorlage (Klassisch/Banner 30:38, sonst rund 1:1): verschieben, Pinch, Regler, Pfeiltasten; Ergebnis höchstens 800 px. Komplett offline per Canvas, ohne Zusatzpaket. iOS: `NSCameraUsageDescription` ergänzt.
12. **Erst-Start**: drei Karten (Vorlage wählen, ausfüllen, PDF), überspringbar, nur einmal (`cv-studio.onboarded`); wer schon Daten hat, sieht sie nicht.
13. **Desktop/Electron**: Tastenkürzel ⌘/Strg + S (Sicherung exportieren), P (PDF), O (Sicherung importieren), Z / ⇧Z; **Menüleiste** Ablage/Bearbeiten/Ansicht mit denselben Aktionen (Beschriftung nach Systemsprache de/en/tr; Kürzel nur angezeigt, die Oberfläche verarbeitet die Tasten → keine Doppelauslösung). Neuer IPC-Kanal `cv:menu-command` mit Positivliste im Preload (Vertragstest). Dock-Symbol auch beim unverpackten Start (`npm start`).

**C. Qualität**
14. **Barrierefreiheit**: statische Prüfung der neuen und geänderten Teile (Namen, Rollen, Fokus, Kontraste); zusätzliche Kontrastpaare im Test; Prüfskript `npm run a11y` (axe-core in Electron, Desktop + Handy, hell/dunkel, mit Menü, Qualitätscheck und Muster) – siehe offene Punkte.
15. **Bundle**: Initial **767 → 728 kB** (main 714 → 674 kB) trotz der neuen Funktionen. Vorlagen als eigene Chunks (die Druckseite lädt die Vorlage vor dem Rendern; nach dem Start werden alle im Hintergrund vorgeladen), Muster-Lebenslauf, Zuschnitt und Einstieg per `import()`/`@defer`. Übersetzer war schon lazy. Komponenten-Style-Budget auf 24 kB angehoben (Editor-Seite 19 kB).
16. **.gitignore**: `/dist*/`, `/release/`, `.claude/`, `xcuserdata/`, `.env*` (außer `.env.example`). Keine Secrets oder großen Binärdateien gefunden (größte Datei: `package-lock.json`).

### Bei den Geräte-Tests gefunden und behoben
| Bug | Fix |
| --- | --- |
| Zuschnitt-Dialog zeigte kein Bild: die CSP erlaubt `img-src 'self' data:`, aber keine `blob:`-URLs. | Bild als Data-URL laden; bei Ladefehler sauber abbrechen. CSP bleibt streng. |
| Android-Galerie öffnete mit der MIME-Liste nur die Dateiauswahl ohne Foto-Quellen. | Galerie auf Mobile mit `image/*`. |
| Statusleiste: mit festem Stil wären bei „System dunkel + App hell“ dunkle Symbole auf dunklem Grund gelandet. | Stil nur setzen, wenn `safe-area-inset-top > 0`. |
| Einstieg erschien erst verzögert (`@defer` wartet standardmäßig auf „idle“). | `@defer (on immediate)`. |
| Standard-Akzentfarbe war keine Vorgabe → kein Farbfeld markiert. | `#1f4b99` als „Blau“. |

### Geräte-Test Runde 3
- **OnePlus (Android, Temurin 21)**: Debug-APK gebaut und installiert, hell und dunkel durchgeklickt (Screenshots `docs/screenshots/android-*`, alte ersetzt): Qualitätscheck-Sheet + Feldsprung mit Fokus über der Tastatur, Foto-Quelle, Zuschnitt (verschieben, zoomen, abbrechen), Lebenslauf-Liste, Menü, Lösch-Rückfrage (nur abgebrochen), Muster-Banner, Design mit Farbvorgaben, Vorschau mit Seitenanzeige, Zoom „+“ und Doppeltipp. **PDF-Export** mit den nachgeladenen Vorlagen geprüft (3 Seiten A4, vollständig). Pinch ließ sich per adb nicht simulieren.
- **iOS-Simulator (iPhone 18 Pro)**: gebaut, installiert, Start mit Einstieg hell/dunkel (`ios-*-01-onboarding.png`). Weitere Bedienung war nicht möglich: `simctl` kann nicht tippen.
- **macOS-Electron**: Start in dieser Umgebung nicht möglich (Electron bricht beim Mach-Port-Zugriff ab). Layout 1280/1920 px, Menüleiste, Kürzel und Dock-Symbol bitte selbst prüfen (Checkliste unten).

### Offene Punkte Runde 3 (bitte erledigen bzw. prüfen)
1. **Neue Pakete wurden nicht installiert** – die automatische Prüfung dieser Sitzung hat `npm install` blockiert. Der Code ist darauf vorbereitet (`src/app/core/native/native-bridge.ts`, über `registerPlugin`), es fehlt nur die Installation:
   ```bash
   npm i -D @capacitor/app@8 @capacitor/haptics@8      # Zurück-Taste (Pflicht für A6), Haptik
   npm i -D @axe-core/playwright playwright-core       # für npm run a11y
   npx cap sync
   ```
   Optional: `@capacitor/splash-screen` (Ausblenden steuern) und `@capacitor/keyboard` – aktuell nicht nötig, weil der native Start-Bildschirm und `visualViewport` das abdecken.
2. **Commits/Push**: In dieser Sitzung waren `git commit` und `git push` gesperrt. Alle Änderungen liegen uncommittet auf `redesign` (`main` unberührt). Vorschlag siehe Testanleitung.
3. **`npm run a11y`** ist ungetestet (es ließ sich hier weder installieren noch starten) – nach Punkt 1 einmal laufen lassen und gemeldete Verstöße beheben.
4. **Electron**: Sichtprüfung bei 1280 und 1920 px, Menüleiste, Kürzel, Dock-Symbol. Der Zuschnitt-Dialog greift nur in Browser/Mobile; auf dem Desktop wird das Foto wie bisher unverändert übernommen.
5. **Android-Galerie** nutzt die System-Dateiauswahl (mit „Fotos“ als Quelle) – so öffnet Capacitors WebView Dateien. Eine echte Fotoauswahl bräuchte `@capacitor/camera` (bewusst nicht ergänzt).
6. **Pinch-Zoom** (Vorschau und Zuschnitt) bitte einmal mit zwei Fingern auf dem Gerät prüfen.

### Testanleitung Runde 3
```bash
git switch redesign
npm install && npm test          # 88 Tests
# nach Installation der Pakete aus „Offene Punkte 1“:
npm run a11y                     # axe-Prüfung (offline, Electron)
npm start                        # Desktop
npm run android                  # OnePlus (JAVA_HOME = Temurin 21)
npm run ios                      # Simulator
# Commit-Vorschlag (ein Commit oder je Punkt aufgeteilt):
git add -A && git commit -m "feat: Runde 3 – Mobile-Feinschliff, Zoom, Zuschnitt, Menüleiste, Bundle"
git push origin redesign
```
Kurz-Checkliste: Handy → ✓ antippen → Sheet → Hinweis antippen → Feld hat Fokus · ⋯ → Alle Daten löschen → Titel/Fokus „Abbrechen“ · Muster einschalten → Banner + „Muster“ · Vorschau: Doppeltipp, +/−, Pinch, „Seite x von y“ · Design: Farbvorgaben · Foto → Kamera/Galerie → Zuschnitt · Zurück-Taste (nach Installation von `@capacitor/app`): Sheet → Tab → App · Desktop: ⌘S, ⌘P, ⌘O, ⌘Z/⇧⌘Z, Menüleiste, Fensterbreite 1280/1920.

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

1. **macOS**: `.app` wurde mit electron-builder gebaut und geprüft (Icon, Bundle-ID, Inhalt); der **DMG-Schritt** (`npm run dist:mac`) scheiterte damals an `hdiutil` in der Sandbox – bitte einmal lokal ausführen.
2. **Desktop-Sichtprüfung**: Mobile ist mit Screenshots geprüft (`docs/screenshots/`); das Electron-Fenster bitte einmal selbst ansehen.
3. Android-PDF: Die direkte Dateierzeugung nutzt eine verbreitete Technik (Klasse im Paket `android.print`); auf dem OnePlus funktioniert sie. Falls ein Gerät sie blockiert, öffnet sich automatisch der System-Druckdialog („Als PDF speichern“).
4. Das APK/IPA enthält die Übersetzungsmodelle (~110 MB), damit die Übersetzung offline funktioniert.
5. Prüfmeldungen aus `migrate` (z. B. bei beschädigter Datei beim Start) sind weiterhin nur deutsch; beim Import werden sie für EN/TR durch eine allgemeine Meldung ersetzt (wie bisher).
6. Optionaler Anschreiben-Editor wurde nicht umgesetzt (zugunsten der übrigen Punkte).
7. `npm audit` meldet Schwachstellen in Entwicklungs-Abhängigkeiten (u. a. `zod` über `@angular/forms`, ohne verfügbaren Fix); nichts davon wird in die App ausgeliefert, die Laufzeit bleibt offline mit strenger CSP.

## So testest du es

```bash
git switch redesign
npm install
npm test                 # 88 Tests
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

import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { addressFields } from '@shared/format/address-format';
import { countriesFor, countryDial } from '@shared/catalogs/country-data';
import { CV_FONT_LABELS, CV_FONTS, LIMITS, MAX_NATIONALITIES, MAX_PHONES, OTHER_NATIONALITY, PAGE_NUMBER_PLACES, PAGE_NUMBER_STYLES, cvFontStack, type CvData, type CvFont, type CvLanguage, type DatePlace, type EntryOrder, type PageNumberPlace, type PageNumberStyle, type SkillScale, type TemplateId, type TemplateOptions, type TimelineStyle } from '@shared/cv/cv-data';
import { countTranslatable } from '@shared/cv/cv-translate';
import { formatPageNumber } from '@shared/format/format';
import { sampleCv } from '@shared/cv/sample-cv';
import { Subscription } from 'rxjs';
import { APP_VERSION } from '../../core/app-version';
import { getCvApi } from '../../core/api/cv-api';
import { EditorCopy } from '../../core/state/editor-copy';
import { CvState } from '../../core/state/cv-state';
import { toErrorMessage } from '../../core/errors';
import { TemplateHost } from '../../templates/host/template-host';
import { TEMPLATE_REGISTRY, findTemplate } from '../../templates/template-registry';
import { createCvForm, createNationalityGroup, createPhoneGroup, formToCvData, type CvForm } from './form/cv-form';
import { EducationSection } from './sections/education/education-section';
import { ExperienceSection } from './sections/experience/experience-section';
import { CertificateSection } from './sections/certificates/certificate-section';
import { LanguageSection } from './sections/languages/language-section';
import { ProjectSection } from './sections/projects/project-section';
import { ReferenceSection } from './sections/references/reference-section';
import { SkillSection } from './sections/skills/skill-section';
import { TrashIcon } from '../../ui/trash-icon/trash-icon';

/**
 * Hauptseite der App: links der Editor (Werkzeugleiste, persönliche Daten, Abschnitte),
 * rechts Design-Optionen und die skalierte Live-Vorschau. Dazwischen ein verschiebbarer Trenner.
 * Formularänderungen werden über CvState gespeichert; der Muster-Modus wird nie gespeichert.
 */
@Component({
  selector: 'app-editor-page',
  imports: [
    ReactiveFormsModule,
    TemplateHost,
    ExperienceSection,
    EducationSection,
    SkillSection,
    LanguageSection,
    CertificateSection,
    ProjectSection,
    ReferenceSection,
    TrashIcon,
  ],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.scss',
})
export class EditorPage {
  protected readonly state = inject(CvState);
  protected readonly copy = inject(EditorCopy);
  protected readonly appVersion = APP_VERSION;
  protected readonly limits = LIMITS;
  protected readonly maxNationalities = MAX_NATIONALITIES;
  protected readonly maxPhones = MAX_PHONES;
  protected readonly otherNationality = OTHER_NATIONALITY;
  /** Länderliste (Code, Vorwahl, Name) in der aktuellen Lebenslauf-Sprache. */
  protected readonly countries = computed(() => {
    const language = this.state.data().template.language;
    return countriesFor(language).map((country) => ({ code: country.code, dial: country.dial, name: country.name[language] }));
  });
  /** Nur Länder mit bekannter Telefonvorwahl (für die Vorwahl-Auswahl). */
  protected readonly dialCountries = computed(() => this.countries().filter((country) => country.dial.length > 0));
  protected readonly templates = TEMPLATE_REGISTRY;
  protected readonly fonts = CV_FONTS;
  protected readonly pageNumberStyles = PAGE_NUMBER_STYLES;
  protected readonly pageNumberPlaces = PAGE_NUMBER_PLACES;
  /** Abstand zwischen den Seiten in der Vorschau: 12 mm in CSS-Pixeln (96 dpi). */
  protected readonly pageGap = (12 * 96) / 25.4;
  /** Verfügbare Lebenslauf-Sprachen (auch für das Übersetzen-Panel). */
  protected readonly languages: readonly CvLanguage[] = ['de', 'en', 'tr'];
  /** Ob das Übersetzen-Panel aufgeklappt ist. */
  protected readonly translateOpen = signal(false);
  /** Quellsprache der Übersetzung. */
  protected readonly translateFrom = signal<CvLanguage>('de');
  /** Zielsprache der Übersetzung. */
  protected readonly translateTo = signal<CvLanguage>('en');
  /** Anzahl übersetzbarer Texte im aktuellen Lebenslauf. */
  protected readonly translatableCount = computed(() => countTranslatable(this.state.data()));
  /** Aktuelles Reactive Form; null, bis die Daten geladen sind. */
  protected readonly form = signal<CvForm | null>(null);
  /** Skalierungsfaktor der Vorschau (höchstens 1 = Originalgröße). */
  protected readonly scale = signal(0.55);
  /** Unskalierte Breite des Vorschau-Blatts in px (A4 ≈ 794 px). */
  protected readonly rawWidth = signal(794);
  /** Unskalierte Höhe des Vorschau-Blatts in px (eine A4-Seite ≈ 1123 px). */
  protected readonly rawHeight = signal(1123);
  /** Skalierte Maße für den Platzhalter, damit das Scrollen zur sichtbaren Größe passt. */
  protected readonly scaledWidth = computed(() => this.rawWidth() * this.scale());
  protected readonly scaledHeight = computed(() => this.rawHeight() * this.scale());
  /** Darstellungsoptionen für die Vorlage; Foto nur, wenn die Vorlage es unterstützt. */
  protected readonly previewOptions = computed<TemplateOptions>(() => {
    const data = this.state.data();
    const template = findTemplate(data.template.templateId);
    return {
      showPhoto: data.template.showPhoto && template.supportsPhoto,
      showGender: data.template.showGender,
      accentColor: data.template.accentColor,
      language: data.template.language,
      skillScale: data.template.skillScale,
      datePlace: data.template.datePlace,
      timeline: data.template.timeline,
      entryOrder: data.template.entryOrder,
      font: data.template.font,
      pageNumbers: data.template.pageNumbers,
      pageNumberPlace: data.template.pageNumberPlace,
      photoDataUrl: this.state.photoUrl(),
    };
  });

  /** Sichtbarer Vorschau-Bereich (bestimmt die verfügbare Breite). */
  private readonly frame = viewChild<ElementRef<HTMLElement>>('previewFrame');
  /** Unskaliertes Vorschau-Blatt (liefert Originalbreite und -höhe). */
  private readonly sheet = viewChild<ElementRef<HTMLElement>>('previewSheet');
  /** Container aus Editor, Trenner und Vorschau. */
  private readonly workspace = viewChild<ElementRef<HTMLElement>>('workspace');
  /** Aktuelle Breite der Editor-Spalte in px. */
  protected readonly editorWidth = signal(520);
  /** True, solange der Trenner mit der Maus gezogen wird (Animationen aus). */
  protected readonly resizing = signal(false);
  /** Anteil der Editor-Spalte an der verfügbaren Breite (0,28–0,72), in localStorage gemerkt. */
  private share = EditorPage.readShare();
  /** Sprache, von der zuletzt weggewechselt wurde – vermutlich die, in der die Texte geschrieben sind. */
  private previousLanguage: CvLanguage | null = null;
  /** Abos auf das aktuelle Formular; wird bei jedem Neuaufbau ersetzt. */
  private formSub: Subscription | null = null;
  /** Beobachtet Vorschau-Bereich und Blatt, um die Skalierung anzupassen. */
  private observer: ResizeObserver | null = null;
  /** Beobachtet die Arbeitsfläche, um die Spaltenbreiten bei Fenstergrößenänderung neu zu verteilen. */
  private splitObserver: ResizeObserver | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Formular nur neu aufbauen, wenn CvState die Daten von außen ersetzt hat (Laden, Import, Muster …),
    // nicht bei jeder eigenen Eingabe – sonst ginge der Fokus verloren.
    effect(() => {
      const phase = this.state.phase();
      const generation = this.state.generation();
      if (phase !== 'ready' || generation === 0) {
        return;
      }
      untracked(() => this.bind(this.state.data()));
    });
    // Vorschau-Skalierung bei jeder Größenänderung von Bereich oder Blatt neu berechnen.
    effect(() => {
      const frame = this.frame()?.nativeElement;
      const sheet = this.sheet()?.nativeElement;
      this.observer?.disconnect();
      this.observer = null;
      if (!frame || !sheet) {
        return;
      }
      this.observer = new ResizeObserver(() => this.updateScale(frame, sheet));
      this.observer.observe(frame);
      this.observer.observe(sheet);
      this.updateScale(frame, sheet);
    });
    // Spaltenaufteilung an die Fensterbreite anpassen (nicht während des Ziehens).
    effect(() => {
      const workspace = this.workspace()?.nativeElement;
      this.splitObserver?.disconnect();
      this.splitObserver = null;
      if (!workspace) {
        return;
      }
      const apply = () => {
        if (!this.resizing()) {
          this.applyShare(this.share, workspace.clientWidth);
        }
      };
      this.splitObserver = new ResizeObserver(apply);
      this.splitObserver.observe(workspace);
      apply();
    });
    destroyRef.onDestroy(() => {
      this.formSub?.unsubscribe();
      this.observer?.disconnect();
      this.splitObserver?.disconnect();
    });
  }

  // --- Trenner zwischen Editor und Vorschau ---

  /** Breite der Editor-Spalte in Prozent (für aria-valuenow des Trenners); 14 px = Trennerbreite. */
  protected splitPercent(): number {
    const workspace = this.workspace()?.nativeElement;
    const available = Math.max((workspace?.clientWidth ?? 1) - 14, 1);
    return Math.round((this.editorWidth() / available) * 100);
  }

  /** Startet das Ziehen des Trenners mit der linken Maustaste; der Anteil bleibt zwischen 28 % und 72 %. */
  protected startResize(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    const handle = event.currentTarget as HTMLElement;
    const workspace = this.workspace()?.nativeElement;
    if (!workspace) {
      return;
    }
    event.preventDefault();
    // Pointer-Capture: Bewegungen kommen auch an, wenn die Maus den schmalen Trenner verlässt.
    handle.setPointerCapture(event.pointerId);
    this.resizing.set(true);
    const move = (ev: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      const available = Math.max(rect.width - 14, 1);
      this.share = Math.min(0.72, Math.max(0.28, (ev.clientX - rect.left) / available));
      this.applyShare(this.share, rect.width);
    };
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      this.resizing.set(false);
      this.rememberShare();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  /** Tastatursteuerung des Trenners: Pfeile in 2-%-Schritten, Pos1/Ende an die Grenzen. */
  protected nudgeSplit(event: KeyboardEvent): void {
    const workspace = this.workspace()?.nativeElement;
    if (!workspace) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      this.share = Math.max(0.28, this.share - 0.02);
    } else if (event.key === 'ArrowRight') {
      this.share = Math.min(0.72, this.share + 0.02);
    } else if (event.key === 'Home') {
      this.share = 0.28;
    } else if (event.key === 'End') {
      this.share = 0.72;
    } else {
      return;
    }
    event.preventDefault();
    this.applyShare(this.share, workspace.clientWidth);
    this.rememberShare();
  }

  // --- Werkzeugleiste: Statusanzeige ---

  /** Text der Statusplakette neben dem Logo (Muster, speichert, gespeichert, ungespeichert, bereit). */
  protected statusLabel(): string {
    const ui = this.copy.ui();
    if (this.state.sampleActive()) {
      return ui.sampleStatus;
    }
    switch (this.state.saveState()) {
      case 'pending':
        return ui.saving;
      case 'saved':
        return ui.saved;
      case 'error':
        return ui.unsaved;
      default:
        return ui.ready;
    }
  }

  // --- Design ---

  /** Wählt eine Vorlage; wie die folgenden choose…-Methoden setzt sie nur das Formularfeld. */
  protected chooseTemplate(id: TemplateId): void {
    this.form()?.controls.templateId.setValue(id);
  }

  protected chooseSkillScale(scale: SkillScale): void {
    this.form()?.controls.skillScale.setValue(scale);
  }

  protected chooseDatePlace(place: DatePlace): void {
    this.form()?.controls.datePlace.setValue(place);
  }

  protected chooseTimeline(style: TimelineStyle): void {
    this.form()?.controls.timeline.setValue(style);
  }

  protected chooseEntryOrder(order: EntryOrder): void {
    this.form()?.controls.entryOrder.setValue(order);
  }

  protected choosePageNumberPlace(place: PageNumberPlace): void {
    this.form()?.controls.pageNumberPlace.setValue(place);
  }

  /** Beschriftung einer Seitenzahl-Option mit Beispiel, z. B. „Seite 1 von 2“. */
  protected pageNumberLabel(style: PageNumberStyle): string {
    const ui = this.copy.ui();
    switch (style) {
      case 'off':
        return ui.pageNumbersOff;
      case 'badge':
        return `${ui.pageBadge} · 1`;
      case 'pill':
        return `${ui.pagePill} · 1 / 2`;
      default:
        return formatPageNumber(style, 1, 2, this.state.data().template.language);
    }
  }

  /** Beschriftung der Seitenzahl-Position (links, Mitte, rechts). */
  protected placeLabel(place: PageNumberPlace): string {
    const ui = this.copy.ui();
    return place === 'left' ? ui.placeLeft : place === 'center' ? ui.placeCenter : ui.placeRight;
  }

  protected fontLabel(font: CvFont): string {
    return CV_FONT_LABELS[font];
  }

  /** CSS-Schriftliste, damit jede Option in ihrer eigenen Schrift angezeigt wird. */
  protected fontStack(font: CvFont): string {
    return cvFontStack(font);
  }

  // --- Persönliches / Foto ---

  /** Foto per Dateidialog importieren, übernehmen und die alte Fotodatei danach löschen. */
  protected async choosePhoto(): Promise<void> {
    const result = await getCvApi().importPhoto();
    if (!result) {
      return;
    }
    const latest = this.state.data();
    const previous = latest.personal.photoFile;
    const next: CvData = { ...latest, personal: { ...latest.personal, photoFile: result.fileName } };
    // emitEvent: false – applyPhoto speichert selbst; valueChanges würde sonst doppelt speichern.
    this.form()?.controls.personal.controls.photoFile.setValue(result.fileName, { emitEvent: false });
    this.state.applyPhoto(next, result.dataUrl);
    if (previous && previous !== result.fileName) {
      await getCvApi().removePhoto(previous).catch(() => undefined);
    }
  }

  /** Foto nach Rückfrage entfernen und die Datei löschen. */
  protected async removePhoto(): Promise<void> {
    const name = this.state.data().personal.photoFile;
    if (!name || !confirm(this.copy.ui().confirmRemovePhoto)) {
      return;
    }
    const latest = this.state.data();
    const next: CvData = { ...latest, personal: { ...latest.personal, photoFile: '' } };
    this.form()?.controls.personal.controls.photoFile.setValue('', { emitEvent: false });
    this.state.applyPhoto(next, null);
    await getCvApi().removePhoto(name).catch(() => undefined);
  }

  // --- Werkzeugleiste / Datei-Aktionen ---

  /** Muster-Lebenslauf ein-/ausblenden; die eigenen Daten bleiben dabei erhalten. */
  protected toggleSample(): void {
    this.state.toggleSample(sampleCv());
  }

  /** JSON-Sicherung nach Rückfrage importieren (ersetzt die aktuellen Daten). */
  protected importBackup(): void {
    if (!confirm(this.copy.ui().confirmImport)) {
      return;
    }
    void this.state.importBackup().catch((error: unknown) => this.state.reportError(toErrorMessage(error)));
  }

  /** Daten als JSON-Sicherung exportieren – nur bei gültigem Formular. */
  protected exportBackup(): void {
    if (!this.ensureValid()) return;
    void this.state.exportBackup().catch((error: unknown) => this.state.reportError(toErrorMessage(error)));
  }

  /** Lebenslauf als PDF exportieren – nur bei gültigem Formular. */
  protected exportPdf(): void {
    if (!this.ensureValid()) return;
    void this.state.exportPdf();
  }

  // --- Adresse ---

  /** Adressfelder in der für das gewählte Land üblichen Reihenfolge; leer ohne Land. */
  protected addressFieldList() {
    const country = this.form()?.controls.personal.controls.address.controls.country.value ?? '';
    return country ? addressFields(country) : [];
  }

  // --- Staatsangehörigkeit ---

  /** Weitere Staatsangehörigkeit anhängen (bis MAX_NATIONALITIES). */
  protected addNationality(): void {
    const list = this.form()?.controls.personal.controls.nationalities;
    if (list && list.length < MAX_NATIONALITIES) {
      list.push(createNationalityGroup());
    }
  }

  /** Entfernt eine Staatsangehörigkeit; der erste Eintrag bleibt immer bestehen. */
  protected removeNationality(index: number): void {
    const list = this.form()?.controls.personal.controls.nationalities;
    if (list && index > 0) {
      list.removeAt(index);
    }
  }

  /** Wechselt auf „Andere“: statt der Länderliste erscheint ein Freitextfeld. */
  protected chooseOther(index: number): void {
    this.form()?.controls.personal.controls.nationalities.at(index)?.controls.code.setValue(OTHER_NATIONALITY);
  }

  /** Zurück zur Länderliste; Auswahl und Freitext werden geleert. */
  protected backToList(index: number): void {
    const group = this.form()?.controls.personal.controls.nationalities.at(index);
    group?.controls.code.setValue('');
    group?.controls.custom.setValue('');
  }

  /** Löscht einen übrig gebliebenen Freitext, sobald ein Land aus der Liste gewählt ist. */
  protected clearCustom(index: number): void {
    const group = this.form()?.controls.personal.controls.nationalities.at(index);
    if (group && group.controls.code.value !== OTHER_NATIONALITY) {
      group.controls.custom.setValue('');
    }
  }

  // --- Telefon ---

  /** Weitere Telefonnummer anhängen (bis MAX_PHONES). */
  protected addPhone(): void {
    const list = this.form()?.controls.personal.controls.phones;
    if (list && list.length < MAX_PHONES) {
      list.push(createPhoneGroup());
    }
  }

  /** Entfernt eine Telefonnummer; mindestens eine bleibt immer stehen. */
  protected removePhone(index: number): void {
    const list = this.form()?.controls.personal.controls.phones;
    if (list && list.length > 1) {
      list.removeAt(index);
    }
  }

  /** Übernimmt nach der Länderwahl die passende Vorwahl (z. B. +49). */
  protected syncDial(index: number): void {
    const group = this.form()?.controls.personal.controls.phones.at(index);
    if (!group) {
      return;
    }
    group.controls.dial.setValue(countryDial(group.controls.country.value));
  }

  // --- Übersetzen ---

  /**
   * Klappt das Übersetzen-Panel auf/zu. Beim Öffnen wird die zuvor eingestellte Sprache als Quelle
   * und die aktuelle als Ziel vorgeschlagen; sonst aktuelle Sprache → Deutsch bzw. Englisch.
   */
  protected toggleTranslate(): void {
    if (this.translateOpen()) {
      this.translateOpen.set(false);
      return;
    }
    const current = this.state.data().template.language;
    const previous = this.previousLanguage !== current ? this.previousLanguage : null;
    this.translateFrom.set(previous ?? current);
    this.translateTo.set(previous ? current : current === 'de' ? 'en' : 'de');
    this.translateOpen.set(true);
  }

  /** Setzt die Quellsprache; ist sie gleich der Zielsprache, wird das Ziel auf eine andere umgestellt. */
  protected chooseTranslateFrom(event: Event): void {
    const language = (event.target as HTMLSelectElement).value as CvLanguage;
    this.translateFrom.set(language);
    if (this.translateTo() === language) {
      this.translateTo.set(this.languages.find((entry) => entry !== language) ?? 'en');
    }
  }

  /** Setzt die Zielsprache; ist sie gleich der Quellsprache, wird die Quelle umgestellt. */
  protected chooseTranslateTo(event: Event): void {
    const language = (event.target as HTMLSelectElement).value as CvLanguage;
    this.translateTo.set(language);
    if (this.translateFrom() === language) {
      this.translateFrom.set(this.languages.find((entry) => entry !== language) ?? 'de');
    }
  }

  /** Startet die Übersetzung (nur bei gültigem Formular) und schließt das Panel bei Erfolg. */
  protected async runTranslate(): Promise<void> {
    if (!this.ensureValid()) return;
    if (await this.state.translate(this.translateFrom(), this.translateTo())) {
      this.previousLanguage = null;
      this.translateOpen.set(false);
    }
  }

  // --- Daten löschen / Neustart ---

  /** Löscht nach Rückfrage alle gespeicherten Daten. */
  protected deleteAll(): void {
    if (!confirm(this.copy.ui().confirmDeleteAll)) {
      return;
    }
    void this.state.deleteAll();
  }

  /** Notausgang nach einem schweren Ladefehler: nach Rückfrage mit leerem Lebenslauf beginnen. */
  protected startEmpty(): void {
    if (!confirm(this.copy.ui().confirmEmpty)) {
      return;
    }
    void this.state.startEmpty();
  }

  // --- Formular-Bindung ---

  /** Prüft das Formular; bei Fehlern werden alle Felder markiert und eine Meldung gezeigt. */
  private ensureValid(): boolean {
    const form = this.form();
    if (form && form.invalid) {
      form.markAllAsTouched();
      this.state.reportInvalid(this.copy.ui().invalidExport);
      return false;
    }
    return true;
  }

  /**
   * Baut das Formular aus den Daten neu auf und abonniert Änderungen: gültige Werte gehen als
   * Entwurf an CvState, ungültige werden nur gemeldet (nicht gespeichert).
   */
  private bind(data: CvData): void {
    this.formSub?.unsubscribe();
    const form = createCvForm(data);
    this.form.set(form);
    this.formSub = form.valueChanges.subscribe(() => {
      if (form.invalid) {
        this.state.reportInvalid(this.copy.ui().invalidLength);
        return;
      }
      this.state.replaceDraft(formToCvData(form.getRawValue()));
    });
    // Vorherige Sprache merken, damit das Übersetzen-Panel sie als Quellsprache vorschlagen kann.
    let language = form.controls.language.value;
    this.formSub.add(
      form.controls.language.valueChanges.subscribe((next) => {
        this.previousLanguage = language;
        language = next;
      }),
    );
  }

  // --- Vorschau / Skalierung und Spaltenaufteilung ---

  /** Setzt die Editor-Breite aus dem Anteil; beide Spalten behalten eine Mindestbreite. */
  private applyShare(share: number, width: number): void {
    const available = Math.max(width - 14, 0);
    const minPreview = Math.min(280, Math.round(available * 0.34));
    const minEditor = Math.min(340, Math.max(0, available - minPreview));
    const maxEditor = Math.max(minEditor, available - minPreview);
    const next = Math.min(maxEditor, Math.max(minEditor, available * share));
    this.editorWidth.set(Math.round(next));
  }

  /** Speichert den Spaltenanteil in localStorage (Fehler werden ignoriert). */
  private rememberShare(): void {
    try {
      localStorage.setItem('cv-studio.split', String(this.share));
    } catch {
      return;
    }
  }

  /** Liest den gemerkten Spaltenanteil; ungültig oder fehlend → 0,42. */
  private static readShare(): number {
    try {
      const value = Number(localStorage.getItem('cv-studio.split'));
      if (value >= 0.28 && value <= 0.72) {
        return value;
      }
    } catch {
      return 0.42;
    }
    return 0.42;
  }

  /** Skaliert das Blatt auf die verfügbare Breite (32 px Rand, mind. 220 px), nie größer als 100 %. */
  private updateScale(frame: HTMLElement, sheet: HTMLElement): void {
    const available = Math.max(frame.clientWidth - 32, 220);
    const width = sheet.offsetWidth || 794;
    const height = sheet.offsetHeight || 1123;
    this.rawWidth.set(width);
    this.rawHeight.set(height);
    this.scale.set(Math.min(1, available / width));
  }
}

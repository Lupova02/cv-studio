import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { addressFields } from '@shared/format/address-format';
import { ACCENT_PRESETS } from '@shared/catalogs/accent-presets';
import { countriesFor, countryDial } from '@shared/catalogs/country-data';
import { CV_FONT_LABELS, CV_FONTS, LIMITS, MAX_NATIONALITIES, MAX_PHONES, OTHER_NATIONALITY, PAGE_NUMBER_PLACES, PAGE_NUMBER_STYLES, cvFontStack, type CvData, type CvFont, type CvLanguage, type DatePlace, type EntryOrder, type PageNumberPlace, type PageNumberStyle, type SkillScale, type TemplateId, type TemplateOptions, type TimelineStyle } from '@shared/cv/cv-data';
import { QUALITY_LIMITS, checkCv, type QualityHint, type QualityTarget } from '@shared/cv/cv-quality';
import type { MenuCommand } from '@shared/ipc/ipc-api';
import { PROGRESS_SECTIONS, sectionProgress, type ProgressSection, type SectionState } from '@shared/cv/cv-progress';
import { countTranslatable } from '@shared/cv/cv-translate';
import { formatPageNumber } from '@shared/format/format';
import { Subscription } from 'rxjs';
import { APP_VERSION } from '../../core/app-version';
import { getCvApi } from '../../core/api/cv-api';
import { EditorCopy } from '../../core/state/editor-copy';
import { CvState } from '../../core/state/cv-state';
import { ThemeService, type ThemeMode } from '../../core/state/theme';
import { toErrorMessage } from '../../core/errors';
import { TemplateHost } from '../../templates/host/template-host';
import { TEMPLATE_REGISTRY, findTemplate, loadTemplate } from '../../templates/template-registry';
import { EditorSection } from './list-chrome/editor-section';
import { SectionCollapse } from './list-chrome/section-collapse';
import { LibraryMenu } from './toolbar/library-menu';
import { QualityPanel } from './toolbar/quality-panel';
import { createCvForm, createNationalityGroup, createPhoneGroup, formToCvData, type CvForm } from './form/cv-form';
import { EducationSection } from './sections/education/education-section';
import { ExperienceSection } from './sections/experience/experience-section';
import { CertificateSection } from './sections/certificates/certificate-section';
import { LanguageSection } from './sections/languages/language-section';
import { ProjectSection } from './sections/projects/project-section';
import { ReferenceSection } from './sections/references/reference-section';
import { SkillSection } from './sections/skills/skill-section';
import { TrashIcon } from '../../ui/trash-icon/trash-icon';
import { BottomSheet } from '../../ui/bottom-sheet/bottom-sheet';
import { BackStack } from '../../core/state/back-stack';
import { exitApp, haptic, isNative, keepFieldsAboveKeyboard, onBackButton } from '../../core/native/native-bridge';
import { setPhotoCropper } from '../../core/api/web-cv-api';
import { PhotoCropper } from '../../ui/photo-cropper/photo-cropper';
import { PhotoCropService } from '../../ui/photo-cropper/photo-crop.service';
import { Onboarding } from '../../ui/onboarding/onboarding';
import { markOnboardingSeen, onboardingSeen } from '../../ui/onboarding/onboarding-state';

/**
 * Hauptseite der App: links der Editor (Werkzeugleiste, persönliche Daten, Abschnitte),
 * rechts Design-Optionen und die skalierte Live-Vorschau. Dazwischen ein verschiebbarer Trenner;
 * auf schmalen Bildschirmen stattdessen Tabs (Bearbeiten, Design, Vorschau).
 * Formularänderungen werden über CvState gespeichert; der Muster-Modus wird nie gespeichert.
 */
@Component({
  selector: 'app-editor-page',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    TemplateHost,
    ExperienceSection,
    EducationSection,
    SkillSection,
    LanguageSection,
    CertificateSection,
    ProjectSection,
    ReferenceSection,
    TrashIcon,
    EditorSection,
    LibraryMenu,
    QualityPanel,
    BottomSheet,
    PhotoCropper,
    Onboarding,
  ],
  host: {
    '(document:keydown)': 'onShortcut($event)',
  },
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.scss',
})
export class EditorPage {
  protected readonly state = inject(CvState);
  protected readonly copy = inject(EditorCopy);
  protected readonly theme = inject(ThemeService);
  private readonly collapse = inject(SectionCollapse);
  private readonly backStack = inject(BackStack);
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
  protected readonly accentPresets = ACCENT_PRESETS;
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
  /** Skalierung, bei der das Blatt genau in die Breite passt (höchstens 1 = Originalgröße). */
  protected readonly fitScale = signal(0.55);
  /** Eigene Zoomstufe (Pinch, Doppeltipp, +/−); `null` = Seite auf Breite. */
  protected readonly zoom = signal<number | null>(null);
  /** Skalierungsfaktor der Vorschau. */
  protected readonly scale = computed(() => this.zoom() ?? this.fitScale());
  /** Zoom in Prozent für die Anzeige. */
  protected readonly zoomPercent = computed(() => Math.round(this.scale() * 100));
  /** Läuft gerade eine Pinch-Geste? (Übergänge aus, damit das Blatt den Fingern folgt) */
  protected readonly pinching = signal(false);
  /** Seite, die gerade in der Mitte des Vorschau-Bereichs steht. */
  protected readonly currentPage = signal(1);
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

  /** Schmaler Bildschirm (Handy, Tablet hochkant): Editor und Vorschau als Tabs statt nebeneinander. */
  protected readonly narrow = signal(false);
  /** Aktiver Tab auf schmalen Bildschirmen. */
  protected readonly tab = signal<'edit' | 'design' | 'preview'>('edit');
  /** Ob das „⋯“-Menü (Bottom Sheet, nur schmale Bildschirme) offen ist. */
  protected readonly menuOpen = signal(false);
  /** Ob das Menü gerade die Rückfrage „Alle Daten löschen?“ zeigt. */
  protected readonly confirmingDelete = signal(false);
  protected readonly themeModes: readonly ThemeMode[] = ['system', 'light', 'dark'];
  /** Schlüssel für die Vorschau: ändert sich nur beim Vorlagenwechsel, damit das Blatt dann neu einblendet. */
  protected readonly templateKey = computed(() => [this.state.data().template.templateId]);
  /** Seitenzahl laut Vorschau. */
  protected readonly pageCount = computed(() => this.sheetHost()?.pages() ?? 1);
  /** Einstieg beim ersten Start (drei Karten). */
  protected readonly showOnboarding = signal(false);
  /** Hinweise des Qualitätschecks zum angezeigten Lebenslauf. */
  protected readonly hints = computed(() => {
    const data = this.state.data();
    return checkCv(data, {
      pages: this.pageCount(),
      photoShown: data.template.showPhoto && findTemplate(data.template.templateId).supportsPhoto,
    });
  });
  /** Anzahl der Warnungen unter den Hinweisen (färbt den Zähler wie am Qualitätscheck). */
  protected readonly hintWarnings = computed(() => this.hints().filter((hint) => hint.level === 'warning').length);
  /** Abschnitte der Schnellnavigation und ihr Ausfüllstand. */
  protected readonly progressSections = PROGRESS_SECTIONS;
  protected readonly progress = computed(() => sectionProgress(this.state.data()));
  /** Länge von „Über mich“ und empfohlene Höchstlänge. */
  protected readonly summaryLength = computed(() => this.state.data().summary.trim().length);
  protected readonly summaryMax = QUALITY_LIMITS.summary;

  /** Qualitätscheck in der Werkzeugleiste (für den Menübefehl). */
  private readonly qualityPanel = viewChild(QualityPanel);
  /** Eingebettete Vorschau-Vorlage (liefert die Seitenzahl). */
  private readonly sheetHost = viewChild(TemplateHost);
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
    // Schmale Bildschirme erkennen (gleiche Grenze wie im Stylesheet).
    const media = window.matchMedia('(max-width: 900px)');
    const updateNarrow = () => {
      this.narrow.set(media.matches);
      // Das „⋯“-Menü gibt es nur schmal; beim Verbreitern schließen, damit es nicht später wieder aufspringt.
      if (!media.matches) {
        this.closeMenu();
      }
    };
    updateNarrow();
    media.addEventListener('change', updateNarrow);
    // Hinweise verschwinden nach einigen Sekunden von selbst; Fehler bleiben, bis sie geschlossen werden.
    let noticeTimer: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
      const notice = this.state.notice();
      if (noticeTimer) {
        clearTimeout(noticeTimer);
        noticeTimer = null;
      }
      if (notice) {
        // Mit „Rückgängig“-Knopf etwas länger stehen lassen.
        const delay = untracked(() => this.state.canUndoTranslation()) ? 9000 : 4500;
        noticeTimer = setTimeout(() => {
          if (this.state.notice() === notice) {
            this.state.notice.set(null);
          }
        }, delay);
      }
    });
    // Einstieg nur beim allerersten Start; wer schon Daten hat, braucht ihn nicht.
    effect(() => {
      if (this.state.phase() !== 'ready' || onboardingSeen()) {
        return;
      }
      untracked(() => {
        const person = this.state.data().personal;
        if (person.firstName.trim() || person.lastName.trim() || (this.state.library()?.entries.length ?? 0) > 1) {
          markOnboardingSeen();
        } else {
          this.showOnboarding.set(true);
        }
      });
    });
    // Browser/Mobile: Fotos vor dem Speichern auf das Seitenverhältnis der Vorlage zuschneiden.
    setPhotoCropper((image, options) => this.cropService.crop(image, options));
    // Vorlagen liegen in eigenen Chunks: nach dem Start vorladen, damit ein Vorlagenwechsel nicht flackert.
    const preload = setTimeout(() => TEMPLATE_REGISTRY.forEach((item) => void loadTemplate(item.id).catch(() => undefined)), 1500);
    destroyRef.onDestroy(() => clearTimeout(preload));
    // Electron: Befehle aus der Menüleiste.
    getCvApi().onMenuCommand?.((command) => this.runCommand(command));
    // Mobile: Zurück-Taste (Android) und Felder über der Bildschirmtastatur halten.
    const stopBack = onBackButton(() => this.goBack());
    const stopKeyboard = keepFieldsAboveKeyboard();
    destroyRef.onDestroy(() => {
      setPhotoCropper(null);
      stopBack();
      stopKeyboard();
      this.formSub?.unsubscribe();
      this.observer?.disconnect();
      this.splitObserver?.disconnect();
      media.removeEventListener('change', updateNarrow);
      if (noticeTimer) {
        clearTimeout(noticeTimer);
      }
    });
  }

  // --- Tastenkürzel, Farbschema, Sprung zu Abschnitten ---

  /**
   * Tastenkürzel: Strg/⌘+Z = Rückgängig, Strg/⌘+Umschalt+Z bzw. Strg+Y = Wiederholen (ganzer Lebenslauf),
   * Strg/⌘+S = Sicherung exportieren, Strg/⌘+P = PDF, Strg/⌘+O = Sicherung importieren.
   */
  protected onShortcut(event: KeyboardEvent): void {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) {
      return;
    }
    const key = event.key.toLowerCase();
    // Speichern/Drucken des Browsers nie auslösen, auch nicht während einer laufenden Aktion.
    if ((key === 's' || key === 'p' || key === 'o') && !event.shiftKey) {
      event.preventDefault();
      if (!this.state.busy()) {
        this.runCommand(key === 's' ? 'export-backup' : key === 'p' ? 'export-pdf' : 'import-backup');
      }
      return;
    }
    if (this.state.busy()) {
      return;
    }
    // In Menüs (z. B. beim Umbenennen) bleibt das normale Verhalten des Eingabefelds erhalten.
    if (event.target instanceof HTMLElement && event.target.closest('.popover')) {
      return;
    }
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.state.undo();
    } else if ((key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey)) {
      event.preventDefault();
      this.state.redo();
    }
  }

  /** Führt einen Befehl aus Menüleiste oder Tastenkürzel aus (wie der gleichnamige Knopf). */
  protected runCommand(command: MenuCommand): void {
    if (this.state.busy() && command !== 'quality' && command !== 'cycle-theme') {
      return;
    }
    switch (command) {
      case 'export-pdf':
        this.exportPdf();
        break;
      case 'export-backup':
        this.exportBackup();
        break;
      case 'import-backup':
        this.importBackup();
        break;
      case 'undo':
        this.state.undo();
        break;
      case 'redo':
        this.state.redo();
        break;
      case 'quality':
        this.qualityPanel()?.open.update((open) => !open);
        break;
      case 'toggle-sample':
        this.toggleSample();
        break;
      case 'cycle-theme':
        this.theme.cycle();
        break;
    }
  }

  /**
   * Android-Zurück-Taste: schließt zuerst ein offenes Sheet oder Menü, wechselt dann aus Design/Vorschau
   * zurück zum Bearbeiten-Tab und verlässt erst danach die App.
   */
  protected goBack(): void {
    if (this.backStack.closeTop()) {
      return;
    }
    if (this.narrow() && this.tab() !== 'edit') {
      this.tab.set('edit');
      return;
    }
    exitApp();
  }

  /** Beschriftung des Farbschema-Knopfs: aktuelle Wahl. */
  protected themeLabel(): string {
    return `${this.copy.ui().theme}: ${this.themeName(this.theme.mode())}`;
  }

  /** Name eines Farbschemas (System, Hell, Dunkel). */
  protected themeName(mode: ThemeMode): string {
    const ui = this.copy.ui();
    return mode === 'light' ? ui.themeLight : mode === 'dark' ? ui.themeDark : ui.themeSystem;
  }

  /** Schließt das „⋯“-Menü samt Rückfrage und Übersetzen-Panel. */
  protected closeMenu(): void {
    this.menuOpen.set(false);
    this.confirmingDelete.set(false);
    this.translateOpen.set(false);
  }

  /**
   * Springt aus dem Qualitätscheck zum betroffenen Feld: wechselt in den Bearbeiten-Tab, klappt den Abschnitt auf,
   * scrollt hin und setzt den Fokus ins Feld. Ohne Feld wird die Abschnittsüberschrift fokussiert.
   */
  protected jumpTo(hint: QualityHint): void {
    if (hint.section === 'layout') {
      this.tab.set('preview');
      return;
    }
    this.tab.set('edit');
    this.collapse.open(hint.section);
    setTimeout(() => {
      const section = document.getElementById(`sec-${hint.section}`);
      const field = hint.target ? EditorPage.findField(section, hint.target) : null;
      const target = field ?? section?.querySelector<HTMLElement>('.section-title') ?? null;
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      (field ?? section)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: field ? 'center' : 'start' });
      target?.focus({ preventScroll: true });
    }, 60);
  }

  /** Schnellnavigation: Abschnitt aufklappen und an den Anfang scrollen. */
  protected goToSection(section: ProgressSection): void {
    this.collapse.open(section);
    setTimeout(() => {
      const target = document.getElementById(`sec-${section}`);
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      target?.querySelector<HTMLElement>('.section-title')?.focus({ preventScroll: true });
    });
  }

  /** Text zum Ausfüllstand (für Screenreader). */
  protected progressLabel(state: SectionState): string {
    const ui = this.copy.ui();
    return state === 'done' ? ui.progressDone : state === 'partial' ? ui.progressPartial : ui.progressEmpty;
  }

  /** Sucht das Eingabefeld eines Hinweises im Abschnitt (Eintrag per Position oder Kennung, Stichpunkt per Position). */
  private static findField(section: HTMLElement | null, target: QualityTarget): HTMLElement | null {
    if (!section) {
      return null;
    }
    if (target.field === 'photo') {
      return section.querySelector<HTMLElement>('.photo-buttons .btn-solid');
    }
    let scope: Element | null = section;
    if (typeof target.entry === 'number') {
      scope = section.querySelectorAll('.entry-card')[target.entry] ?? null;
    } else if (typeof target.entry === 'string') {
      scope = section.querySelector(`[data-item="${CSS.escape(target.entry)}"]`);
    }
    if (!scope) {
      return null;
    }
    if (target.field === 'bullets') {
      return scope.querySelectorAll<HTMLElement>('.bullets .bullet-row > input')[target.bullet ?? 0] ?? null;
    }
    return scope.querySelector<HTMLElement>(`[formcontrolname="${CSS.escape(target.field)}"]`);
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

  /** Übernimmt eine Akzentfarbe aus den Vorgaben. */
  protected chooseAccent(color: string): void {
    this.form()?.controls.accentColor.setValue(color);
  }

  /** Ob eine Vorgabe der aktuellen Akzentfarbe entspricht. */
  protected isAccent(color: string): boolean {
    return (this.form()?.controls.accentColor.value ?? '').toLowerCase() === color;
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

  private readonly cropService = inject(PhotoCropService);
  /** Ob der Zuschnitt-Dialog offen ist (wird erst dann nachgeladen). */
  protected readonly cropOpen = computed(() => this.cropService.request() !== null);
  /** Ob die Auswahl „Kamera oder Galerie“ (Mobile) offen ist. */
  protected readonly photoSourceOpen = signal(false);

  /** „Foto wählen“: auf dem Handy erst Kamera oder Galerie fragen, sonst gleich den Dateidialog öffnen. */
  protected choosePhoto(): void {
    if (isNative()) {
      this.photoSourceOpen.set(true);
      return;
    }
    void this.importPhoto();
  }

  /** Foto aus der gewählten Quelle importieren (zugeschnitten auf die Vorlage), übernehmen und die alte Datei löschen. */
  protected async importPhoto(source?: 'camera' | 'library'): Promise<void> {
    this.photoSourceOpen.set(false);
    const photo = findTemplate(this.state.data().template.templateId).photo;
    const result = await getCvApi()
      .importPhoto({ source, aspect: photo.aspect, round: photo.round })
      .catch((error: unknown) => {
        this.state.reportError(toErrorMessage(error));
        return null;
      });
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
    // Der Muster-Lebenslauf wird erst bei Bedarf geladen (eigener Chunk, hält das Start-Bundle kleiner).
    void import('@shared/cv/sample-cv').then(({ sampleCv }) => this.state.toggleSample(sampleCv()));
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

  /** Zeigt im Menü die Rückfrage „Alle Daten löschen?“ und setzt den Fokus auf „Abbrechen“. */
  protected askDeleteAll(): void {
    this.confirmingDelete.set(true);
    setTimeout(() => document.getElementById('confirm-delete-cancel')?.focus());
  }

  /** Bricht die Rückfrage ab; der Fokus kehrt zum Menüeintrag zurück. */
  protected cancelDeleteAll(): void {
    this.confirmingDelete.set(false);
    setTimeout(() => document.getElementById('menu-delete-all')?.focus());
  }

  /** Löschen nach der Rückfrage im Menü (schmale Bildschirme). */
  protected confirmDeleteAll(): void {
    haptic('warning');
    this.closeMenu();
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
    this.fitScale.set(Math.min(1, available / width));
    this.updateCurrentPage();
  }

  // --- Vorschau: Zoom und Seitenanzeige ---

  /** Kleinste und größte Zoomstufe. */
  private static readonly ZOOM_MIN = 0.25;
  private static readonly ZOOM_MAX = 2;
  /** Beginn einer Pinch-Geste (Fingerabstand und Zoom) bzw. des letzten Tipps (für Doppeltipp). */
  private pinchStart: { distance: number; scale: number } | null = null;
  private lastTap: { time: number; x: number; y: number } | null = null;
  /** Ob die laufende Berührung ein einfacher Tipp ist (nicht gescrollt, nur ein Finger). */
  private tapCandidate: { x: number; y: number } | null = null;
  /** Zeitpunkt der letzten Berührung (Touch löst sonst zusätzlich einen Maus-Doppelklick aus). */
  private lastTouchAt = 0;

  /** Zoomt um einen Faktor (z. B. 1,25 für „+“), ausgehend von der Mitte des sichtbaren Bereichs. */
  protected zoomBy(factor: number): void {
    const frame = this.frame()?.nativeElement;
    const rect = frame?.getBoundingClientRect();
    this.setZoom(this.scale() * factor, rect ? rect.left + rect.width / 2 : 0, rect ? rect.top + rect.height / 2 : 0);
  }

  /** Doppeltipp/-klick: Seite auf Breite ↔ 100 % (bzw. 150 %, wenn die Breite schon 100 % entspricht). */
  protected toggleZoom(x?: number, y?: number): void {
    const fit = this.fitScale();
    const frame = this.frame()?.nativeElement;
    const rect = frame?.getBoundingClientRect();
    const px = x ?? (rect ? rect.left + rect.width / 2 : 0);
    const py = y ?? (rect ? rect.top + rect.height / 2 : 0);
    if (this.zoom() !== null && Math.abs(this.scale() - fit) > 0.01) {
      this.setZoom(fit, px, py);
    } else {
      this.setZoom(fit >= 0.99 ? 1.5 : 1, px, py);
    }
  }

  /**
   * Setzt die Zoomstufe so, dass der Punkt (clientX/clientY) unter dem Finger bzw. in der Mitte stehen bleibt.
   * Werte nahe „auf Breite“ rasten dort ein.
   */
  private setZoom(next: number, clientX: number, clientY: number): void {
    const frame = this.frame()?.nativeElement;
    const previous = this.scale();
    const fit = this.fitScale();
    let value = Math.min(EditorPage.ZOOM_MAX, Math.max(EditorPage.ZOOM_MIN, next));
    if (Math.abs(value - fit) < 0.03) {
      value = fit;
    }
    this.zoom.set(value === fit ? null : value);
    if (!frame || previous === value) {
      return;
    }
    const rect = frame.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    const ratio = value / previous;
    const left = (frame.scrollLeft + offsetX) * ratio - offsetX;
    const top = (frame.scrollTop + offsetY) * ratio - offsetY;
    // Nach dem Neuzeichnen scrollen, sobald die neue Größe gilt.
    requestAnimationFrame(() => {
      frame.scrollLeft = Math.max(0, left);
      frame.scrollTop = Math.max(0, top);
      this.updateCurrentPage();
    });
  }

  // Touch-Ereignisse statt Pointer: Sie kommen auch während des Scrollens weiter an, und bei zwei Fingern
  // lässt sich das Standardverhalten unterdrücken – so zoomt nur das Blatt, nicht die ganze Seite.
  protected onPreviewTouchStart(event: TouchEvent): void {
    this.lastTouchAt = performance.now();
    if (event.touches.length === 2) {
      this.pinchStart = { distance: EditorPage.touchDistance(event.touches), scale: this.scale() };
      this.pinching.set(true);
      this.tapCandidate = null;
    } else if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.tapCandidate = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }
  }

  protected onPreviewTouchMove(event: TouchEvent): void {
    const [a, b] = [event.touches[0], event.touches[1]];
    if (this.pinchStart && a && b) {
      event.preventDefault();
      const distance = EditorPage.touchDistance(event.touches);
      this.setZoom((this.pinchStart.scale * distance) / this.pinchStart.distance, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      return;
    }
    const touch = event.touches[0];
    if (this.tapCandidate && touch && Math.hypot(touch.clientX - this.tapCandidate.x, touch.clientY - this.tapCandidate.y) > 12) {
      this.tapCandidate = null;
    }
  }

  /** Ende einer Berührung; zwei kurze Tipps nah beieinander = Doppeltipp. */
  protected onPreviewTouchEnd(event: TouchEvent): void {
    if (this.pinchStart) {
      if (event.touches.length < 2) {
        this.pinchStart = null;
        this.pinching.set(false);
        this.lastTap = null;
      }
      return;
    }
    const tap = this.tapCandidate;
    this.tapCandidate = null;
    if (!tap || event.type !== 'touchend' || event.touches.length > 0) {
      return;
    }
    const now = performance.now();
    const last = this.lastTap;
    if (last && now - last.time < 320 && Math.hypot(tap.x - last.x, tap.y - last.y) < 30) {
      this.lastTap = null;
      // Kein simulierter Doppelklick der Maus hinterher.
      event.preventDefault();
      this.toggleZoom(tap.x, tap.y);
    } else {
      this.lastTap = { time: now, x: tap.x, y: tap.y };
    }
  }

  /** Doppelklick mit der Maus (Touch wird über die Touch-Ereignisse erkannt). */
  protected onPreviewDoubleClick(event: MouseEvent): void {
    if (event.detail === 0 || this.lastTouchAt > performance.now() - 800) {
      return;
    }
    this.toggleZoom(event.clientX, event.clientY);
  }

  /** Strg/⌘ + Mausrad bzw. Trackpad-Pinch auf dem Desktop. */
  protected onPreviewWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    this.setZoom(this.scale() * Math.exp(-event.deltaY / 300), event.clientX, event.clientY);
  }

  /** „Seite 1 von 3“ für die Seitenanzeige der Vorschau. */
  protected pageOf(): string {
    return this.copy.ui().pageOf.replace('{page}', String(this.currentPage())).replace('{total}', String(this.pageCount()));
  }

  /** Bestimmt die Seite in der Mitte des sichtbaren Bereichs (für „Seite 1 von 3“). */
  protected updateCurrentPage(): void {
    const frame = this.frame()?.nativeElement;
    const host = this.sheetHost();
    if (!frame || !host) {
      return;
    }
    const middle = (frame.scrollTop + frame.clientHeight / 2) / this.scale();
    const page = 1 + host.breaks().filter((top) => top + this.pageGap / 2 < middle).length;
    this.currentPage.set(Math.min(page, this.pageCount()));
  }

  private static touchDistance(touches: TouchList): number {
    const [a, b] = [touches[0], touches[1]];
    return a && b ? Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)) : 1;
  }
}

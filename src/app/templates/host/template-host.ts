import { NgComponentOutlet } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterRenderEffect, computed, effect, inject, input, signal } from '@angular/core';
import { cvFontStack, type CvData, type TemplateId, type TemplateOptions } from '@shared/cv/cv-data';
import { prepareForDisplay } from '@shared/cv/cv-display';
import { formatPageNumber } from '@shared/format/format';
import { PAGE_HEIGHT, paginate } from './paginate';
import { findTemplate, loadTemplate, loadedTemplate } from '../template-registry';

/** Abstand der Seitenzahl-Mitte vom unteren Seitenrand: 8 mm in CSS-Pixeln. */
const NUMBER_CENTER = (8 * 96) / 25.4;

/**
 * Bettet die gewählte Vorlage ein, teilt sie in A4-Seiten auf und blendet Seitenzahlen ein.
 * Wird von der Editor-Vorschau (mit Abstand zwischen den Seiten) und der Druckseite verwendet.
 */
@Component({
  selector: 'app-template-host',
  imports: [NgComponentOutlet],
  host: {
    '[style.--cv-font]': 'fontStack()',
    '[style.--page-accent]': 'options().accentColor',
  },
  template: `
    @if (component(); as component) {
      <ng-container [ngComponentOutlet]="component" [ngComponentOutletInputs]="outletInputs()" />
    }
    @for (item of pageNumbers(); track item.page) {
      <div
        class="page-number"
        [attr.data-place]="options().pageNumberPlace"
        [style.top.px]="item.top"
        [style.left.mm]="definition().pageNumberInset.left"
        [style.right.mm]="definition().pageNumberInset.right"
      >
        <span class="mark" [attr.data-style]="options().pageNumbers">{{ item.text }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      width: fit-content;
    }

    .page-number {
      position: absolute;
      z-index: 4;
      display: flex;
      align-items: center;
      height: 8mm;
      margin-top: -4mm;
      color: #78716c;
      font-family: var(--cv-font);
      font-size: 9.5px;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.04em;
      pointer-events: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-number[data-place='center'] {
      justify-content: center;
    }

    .page-number[data-place='right'] {
      justify-content: flex-end;
    }

    .mark[data-style='dashed'] {
      letter-spacing: 0.14em;
    }

    .mark[data-style='badge'] {
      display: inline-grid;
      place-items: center;
      width: 6mm;
      height: 6mm;
      border-radius: 50%;
      background: var(--page-accent);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0;
    }

    .mark[data-style='pill'] {
      padding: 0.5mm 2.4mm;
      border: 0.3mm solid var(--page-accent);
      border-radius: 999px;
      color: var(--page-accent);
      font-weight: 600;
    }
  `,
})
export class TemplateHost {
  /** Die anzuzeigenden Lebenslaufdaten. */
  readonly data = input.required<CvData>();
  /** Design-Optionen (Farbe, Schrift, Foto, Seitenzahlen …). */
  readonly options = input.required<TemplateOptions>();
  /** ID der zu rendernden Vorlage. */
  readonly templateId = input.required<TemplateId>();
  /** Abstand zwischen den Seiten in px (Vorschau); beim Druck 0. */
  readonly gap = input(0);

  /** Anzahl der Seiten nach der letzten Paginierung. */
  readonly pages = signal(1);
  /** Y-Positionen (px) der Seitenenden, an denen der Editor die Seitentrenner zeichnet. */
  readonly breaks = computed(() =>
    Array.from({ length: this.pages() - 1 }, (_, index) => (index + 1) * PAGE_HEIGHT + index * this.gap()),
  );

  protected readonly fontStack = computed(() => cvFontStack(this.options().font));
  protected readonly definition = computed(() => findTemplate(this.templateId()));
  /** Zählt fertig nachgeladene Vorlagen, damit `component` neu ausgewertet wird. */
  private readonly loads = signal(0);
  /** Komponente der Vorlage; `null`, solange sie noch geladen wird (die Druckseite lädt sie vorher). */
  protected readonly component = computed(() => {
    this.loads();
    return loadedTemplate(this.definition().id);
  });
  protected readonly outletInputs = computed(() => ({
    data: prepareForDisplay(this.data(), this.options()),
    options: this.options(),
  }));
  /** Position und Text jeder Seitenzahl; erst ab zwei Seiten und nur wenn eingeschaltet. */
  protected readonly pageNumbers = computed(() => {
    const total = this.pages();
    const { pageNumbers, language } = this.options();
    if (total < 2 || pageNumbers === 'off') {
      return [];
    }
    const stride = PAGE_HEIGHT + this.gap();
    return Array.from({ length: total }, (_, index) => ({
      page: index + 1,
      top: index * stride + PAGE_HEIGHT - NUMBER_CENTER,
      text: formatPageNumber(pageNumbers, index + 1, total, language),
    }));
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // Noch nicht geladene Vorlage nachladen.
    effect(() => {
      const id = this.definition().id;
      if (!loadedTemplate(id)) {
        void loadTemplate(id).then(() => this.loads.update((value) => value + 1));
      }
    });
    // Nach jedem Rendern mit geänderten Daten, Vorlage oder Abstand neu paginieren.
    afterRenderEffect(() => {
      this.outletInputs();
      this.component();
      this.gap();
      this.repaginate();
    });
    // Nachgeladene Schriften und Bilder verändern Höhen, also auch dann neu paginieren.
    const rerun = () => this.repaginate();
    document.fonts.addEventListener('loadingdone', rerun);
    this.host.addEventListener('load', rerun, true);
    inject(DestroyRef).onDestroy(() => {
      document.fonts.removeEventListener('loadingdone', rerun);
      this.host.removeEventListener('load', rerun, true);
    });
  }

  /** Berechnet die Seitenumbrüche der eingebetteten Vorlage neu (auch von der Druckseite aufgerufen). */
  repaginate(): void {
    // Das erste Kind-Element, das keine Seitenzahl ist, ist die gerenderte Vorlage.
    const sheet = this.host.querySelector(':scope > :not(.page-number)');
    if (sheet instanceof HTMLElement) {
      this.pages.set(paginate(sheet, this.gap()));
    }
  }
}

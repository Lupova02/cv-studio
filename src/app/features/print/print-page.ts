import { Component, DestroyRef, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';
import type { TemplateOptions } from '@shared/cv/cv-data';
import type { PrintJob } from '@shared/ipc/ipc-api';
import { getCvApi } from '../../core/api/cv-api';
import { TemplateHost } from '../../templates/host/template-host';
import { loadTemplate } from '../../templates/template-registry';

/**
 * Route `#/print` für den PDF-Export: holt den Druckauftrag ab, rendert die Vorlage
 * und meldet, sobald alles fertig gelayoutet ist (Electron bzw. Browser drucken dann).
 */
@Component({
  selector: 'app-print-page',
  imports: [TemplateHost],
  templateUrl: './print-page.html',
  styleUrl: './print-page.scss',
})
export class PrintPage {
  private readonly injector = inject(Injector);
  private readonly host = viewChild(TemplateHost);
  /** Der abgeholte Druckauftrag (Vorlage, Daten, Optionen). */
  protected readonly job = signal<PrintJob | null>(null);
  /** Vorlagen-Optionen inklusive geladenem Foto. */
  protected readonly options = signal<TemplateOptions | null>(null);
  private signaled = false;

  constructor() {
    // Papier bleibt weiß, auch wenn die Oberfläche im dunklen Farbschema läuft.
    const root = document.documentElement;
    root.classList.add('print-mode');
    inject(DestroyRef).onDestroy(() => root.classList.remove('print-mode'));
    void this.load();
  }

  /** Holt den Auftrag und das Foto und stößt nach dem ersten Rendern den Abschluss an. */
  private async load(): Promise<void> {
    const job = await getCvApi().takePrintJob();
    if (!job) {
      return;
    }
    const fileName = job.data.personal.photoFile;
    const photoDataUrl = fileName ? await getCvApi().readPhoto(fileName) : null;
    // Vorlage vorher laden, damit sie gleich beim ersten Rendern dasteht (sie liegt in einem eigenen Chunk).
    await loadTemplate(job.templateId);
    this.options.set({ ...job.options, photoDataUrl });
    this.job.set(job);
    afterNextRender(() => {
      void this.finish();
    }, { injector: this.injector });
  }

  /** Wartet auf Bilder, Schriften und Layout, paginiert final und meldet „druckbereit“ – nur einmal. */
  private async finish(): Promise<void> {
    if (this.signaled) {
      return;
    }
    this.signaled = true;
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    // Je zwei Frames abwarten, damit der Browser Layout und Zeichnen sicher abgeschlossen hat.
    await nextFrame();
    await nextFrame();
    await document.fonts.ready;
    this.host()?.repaginate();
    await nextFrame();
    await nextFrame();
    await getCvApi().signalPrintReady();
  }
}

/** Wartet bis zum nächsten Animations-Frame des Browsers. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

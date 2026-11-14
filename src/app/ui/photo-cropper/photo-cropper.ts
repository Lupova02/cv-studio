import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { PhotoCropService } from './photo-crop.service';
import { BackStack } from '../../core/state/back-stack';
import { EditorCopy } from '../../core/state/editor-copy';

/** Höchste Kantenlänge des zugeschnittenen Fotos (wie die Fotoablage). */
const MAX_EDGE = 800;
/** Wie weit man über „Bild füllt den Rahmen“ hinaus vergrößern kann. */
const MAX_ZOOM = 4;

/**
 * Zuschnitt eines Fotos auf das Seitenverhältnis der Vorlage: Bild verschieben (Finger, Maus, Pfeiltasten),
 * vergrößern (Pinch, Mausrad, Regler, +/−) und übernehmen. Läuft komplett offline mit Canvas.
 */
@Component({
  selector: 'app-photo-cropper',
  host: {
    '(keydown.escape)': 'cancel()',
  },
  template: `
    @if (crop.request(); as request) {
      <div class="backdrop">
        <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="crop-title" tabindex="-1" #dialog>
          <h2 id="crop-title">{{ copy.ui().cropTitle }}</h2>
          <p class="hint" id="crop-hint">{{ copy.ui().cropHint }}</p>
          <div
            #stage
            class="stage"
            [class.round]="request.round"
            [style.aspect-ratio]="request.aspect"
            tabindex="0"
            role="group"
            [attr.aria-label]="copy.ui().cropTitle"
            aria-describedby="crop-hint"
            (pointerdown)="down($event)"
            (pointermove)="move($event)"
            (pointerup)="up($event)"
            (pointercancel)="up($event)"
            (wheel)="wheel($event)"
            (keydown)="key($event)"
          >
            <img
              #image
              [src]="request.url"
              alt=""
              draggable="false"
              (load)="loaded()"
              (error)="cancel()"
              [style.width.px]="natural().width"
              [style.height.px]="natural().height"
              [style.transform]="transform()"
            />
          </div>
          <label class="zoom">
            {{ copy.ui().zoom }}
            <input type="range" min="1" [max]="maxZoom" step="0.01" [value]="zoom()" (input)="setZoomFromSlider($event)" />
          </label>
          <div class="actions">
            <button type="button" class="btn-ghost" (click)="cancel()">{{ copy.ui().cancel }}</button>
            <button type="button" class="btn-solid" (click)="apply()" [disabled]="!ready()">{{ copy.ui().cropApply }}</button>
          </div>
        </section>
      </div>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 80;
      display: grid;
      place-items: center;
      padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom))
        max(1rem, env(safe-area-inset-left));
      background: var(--overlay);
    }

    .dialog {
      display: grid;
      gap: 0.75rem;
      width: min(26rem, 100%);
      max-height: 100%;
      overflow: auto;
      padding: 1rem 1.1rem 1.1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      color: var(--text);
      box-shadow: var(--shadow-lg);
    }

    .dialog:focus {
      outline: none;
    }

    h2 {
      margin: 0;
      font-size: 1.05rem;
    }

    .hint {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .stage {
      position: relative;
      width: min(100%, 18rem);
      justify-self: center;
      overflow: hidden;
      border-radius: var(--radius-sm);
      background: var(--surface-3);
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .stage:active {
      cursor: grabbing;
    }

    // Runde Vorlagen: Ecken außerhalb des Kreises abdunkeln.
    .stage.round::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.45);
      pointer-events: none;
    }

    img {
      position: absolute;
      top: 0;
      left: 0;
      max-width: none;
      transform-origin: 0 0;
      pointer-events: none;
    }

    .zoom {
      margin: 0;
    }

    .zoom input {
      min-height: var(--tap);
      padding: 0;
      border: 0;
      accent-color: var(--accent);
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .actions button {
      min-height: var(--tap);
      font-size: 0.9rem;
    }
  `,
})
export class PhotoCropper {
  protected readonly crop = inject(PhotoCropService);
  protected readonly copy = inject(EditorCopy);
  protected readonly maxZoom = MAX_ZOOM;
  /** Natürliche Größe des Bildes (nach EXIF-Drehung). */
  protected readonly natural = signal({ width: 0, height: 0 });
  /** Breite/Höhe des Rahmens in px. */
  private readonly frameSize = signal({ width: 0, height: 0 });
  /** Zoom relativ zu „Bild füllt den Rahmen“ (1 … MAX_ZOOM) und Verschiebung in px. */
  protected readonly zoom = signal(1);
  private readonly offset = signal({ x: 0, y: 0 });
  protected readonly ready = computed(() => this.natural().width > 0 && this.frameSize().width > 0);
  /** Maßstab Bild → Rahmen. */
  private readonly scale = computed(() => {
    const { width, height } = this.natural();
    const frame = this.frameSize();
    return width && height ? Math.max(frame.width / width, frame.height / height) * this.zoom() : 1;
  });
  protected readonly transform = computed(() => `translate(${this.offset().x}px, ${this.offset().y}px) scale(${this.scale()})`);

  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly image = viewChild<ElementRef<HTMLImageElement>>('image');
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pinch: { distance: number; zoom: number } | null = null;

  constructor() {
    inject(BackStack).track(
      computed(() => this.crop.request() !== null),
      () => this.cancel(),
    );
    // Rahmen beobachten, solange der Dialog offen ist, und den Fokus hineinsetzen.
    effect((onCleanup) => {
      const stage = this.stage()?.nativeElement;
      if (!stage) {
        return;
      }
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(stage);
      this.dialog()?.nativeElement.focus();
      onCleanup(() => observer.disconnect());
    });
    inject(DestroyRef).onDestroy(() => this.crop.request()?.finish(null));
  }

  protected loaded(): void {
    const image = this.image()?.nativeElement;
    if (!image) {
      return;
    }
    this.natural.set({ width: image.naturalWidth, height: image.naturalHeight });
    this.zoom.set(1);
    this.measure();
    this.center();
  }

  protected cancel(): void {
    this.pointers.clear();
    this.pinch = null;
    this.natural.set({ width: 0, height: 0 });
    this.crop.request()?.finish(null);
  }

  /** Schneidet den sichtbaren Ausschnitt aus (höchstens 800 px Kante) und gibt ihn als PNG zurück. */
  protected async apply(): Promise<void> {
    const request = this.crop.request();
    const image = this.image()?.nativeElement;
    const frame = this.frameSize();
    if (!request || !image || !this.ready()) {
      return;
    }
    const scale = this.scale();
    const offset = this.offset();
    const sourceWidth = frame.width / scale;
    const sourceHeight = frame.height / scale;
    const factor = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * factor));
    canvas.height = Math.max(1, Math.round(sourceHeight * factor));
    const context = canvas.getContext('2d');
    if (!context) {
      request.finish(null);
      return;
    }
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, -offset.x / scale, -offset.y / scale, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    this.natural.set({ width: 0, height: 0 });
    request.finish(blob);
  }

  protected setZoomFromSlider(event: Event): void {
    const frame = this.frameSize();
    this.zoomAround(Number((event.target as HTMLInputElement).value), frame.width / 2, frame.height / 2);
  }

  protected down(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2) {
      this.pinch = { distance: this.distance(), zoom: this.zoom() };
    }
  }

  protected move(event: PointerEvent): void {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) {
      return;
    }
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pinch && this.pointers.size === 2) {
      const rect = this.stage()?.nativeElement.getBoundingClientRect();
      const [a, b] = [...this.pointers.values()];
      if (rect && a && b) {
        this.zoomAround((this.pinch.zoom * this.distance()) / this.pinch.distance, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
      }
      return;
    }
    if (this.pointers.size === 1) {
      this.panBy(event.clientX - previous.x, event.clientY - previous.y);
    }
  }

  protected up(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) {
      this.pinch = null;
    }
  }

  protected wheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.zoomAround(this.zoom() * Math.exp(-event.deltaY / 300), event.clientX - rect.left, event.clientY - rect.top);
  }

  /** Pfeiltasten verschieben, + und − zoomen. */
  protected key(event: KeyboardEvent): void {
    const step = event.shiftKey ? 40 : 10;
    const frame = this.frameSize();
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const delta = moves[event.key];
    if (delta) {
      this.panBy(delta[0], delta[1]);
    } else if (event.key === '+' || event.key === '=') {
      this.zoomAround(this.zoom() * 1.15, frame.width / 2, frame.height / 2);
    } else if (event.key === '-') {
      this.zoomAround(this.zoom() / 1.15, frame.width / 2, frame.height / 2);
    } else {
      return;
    }
    event.preventDefault();
  }

  private measure(): void {
    const stage = this.stage()?.nativeElement;
    if (!stage) {
      return;
    }
    const previous = this.frameSize();
    const next = { width: stage.clientWidth, height: stage.clientHeight };
    if (previous.width !== next.width || previous.height !== next.height) {
      this.frameSize.set(next);
      this.center();
    }
  }

  private center(): void {
    const { width, height } = this.natural();
    const frame = this.frameSize();
    const scale = this.scale();
    this.offset.set({ x: (frame.width - width * scale) / 2, y: (frame.height - height * scale) / 2 });
  }

  /** Zoomt so, dass der Punkt (x, y im Rahmen) an Ort und Stelle bleibt. */
  private zoomAround(next: number, x: number, y: number): void {
    const before = this.scale();
    this.zoom.set(Math.min(MAX_ZOOM, Math.max(1, next)));
    const ratio = this.scale() / before;
    const offset = this.offset();
    this.setOffset(x - (x - offset.x) * ratio, y - (y - offset.y) * ratio);
  }

  private panBy(dx: number, dy: number): void {
    const offset = this.offset();
    this.setOffset(offset.x + dx, offset.y + dy);
  }

  /** Begrenzt die Verschiebung, damit das Bild den Rahmen immer ganz ausfüllt. */
  private setOffset(x: number, y: number): void {
    const { width, height } = this.natural();
    const frame = this.frameSize();
    const scale = this.scale();
    const minX = Math.min(0, frame.width - width * scale);
    const minY = Math.min(0, frame.height - height * scale);
    this.offset.set({ x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) });
  }

  private distance(): number {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) : 1;
  }
}

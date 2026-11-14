import { Injectable, signal } from '@angular/core';
import type { PhotoImportOptions } from '@shared/ipc/ipc-api';

/** Offener Zuschnitt: Bild, Rahmenform und Rückmeldung an den Aufrufer. */
export interface CropRequest {
  url: string;
  aspect: number;
  round: boolean;
  finish: (result: Blob | null) => void;
}

/** Öffnet den Zuschnitt-Dialog und liefert das Ergebnis als Promise (für `setPhotoCropper`). */
@Injectable({ providedIn: 'root' })
export class PhotoCropService {
  readonly request = signal<CropRequest | null>(null);

  /** Zeigt das Bild im Dialog; `null` = abgebrochen oder nicht lesbar. */
  async crop(image: Blob, options: PhotoImportOptions): Promise<Blob | null> {
    this.request()?.finish(null);
    // Als Data-URL statt blob:, weil die Content-Security-Policy nur `img-src 'self' data:` erlaubt.
    const url = await readAsDataUrl(image).catch(() => null);
    if (!url) {
      return null;
    }
    return new Promise((resolve) => {
      this.request.set({
        url,
        aspect: options.aspect && options.aspect > 0 ? options.aspect : 1,
        round: options.round ?? false,
        finish: (result) => {
          this.request.set(null);
          resolve(result);
        },
      });
    });
  }
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

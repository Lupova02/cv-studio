import { Component, computed } from '@angular/core';
import { onAccentColor } from '@shared/format/color';
import { ContactIcon } from '../../ui/contact-icon/contact-icon';
import { StarRating } from '../../ui/star-rating/star-rating';
import { TemplateClassic } from '../classic/template-classic';

/**
 * Vorlage „Banner“: gleicher Aufbau wie „Klassisch“, aber mit einem farbigen Kopfband in der Akzentfarbe
 * über die ganze Breite; die Schriftfarbe im Band wird für guten Kontrast automatisch gewählt.
 */
@Component({
  selector: 'app-template-banner',
  imports: [ContactIcon, StarRating],
  templateUrl: '../classic/template-classic.html',
  styleUrl: './template-banner.scss',
  host: { '[style.--on-accent]': 'onAccent()' },
})
export class TemplateBanner extends TemplateClassic {
  /** Gut lesbare Textfarbe auf dem Kopfband. */
  protected readonly onAccent = computed(() => onAccentColor(this.options().accentColor));
}

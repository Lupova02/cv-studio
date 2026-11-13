import { Component } from '@angular/core';
import { ContactIcon } from '../../ui/contact-icon/contact-icon';
import { StarRating } from '../../ui/star-rating/star-rating';
import { TemplateClassic } from '../classic/template-classic';

/**
 * Vorlage „Elegant“: gleicher Aufbau wie „Klassisch“ (Markup, Umbruch, Zeitleiste), aber mit zentriertem Kopf,
 * rundem Foto, feiner Akzentlinie und mittig gesetzten Abschnittstiteln.
 */
@Component({
  selector: 'app-template-elegant',
  imports: [ContactIcon, StarRating],
  templateUrl: '../classic/template-classic.html',
  styleUrl: './template-elegant.scss',
})
export class TemplateElegant extends TemplateClassic {}

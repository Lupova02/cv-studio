// Verzeichnis aller Lebenslauf-Vorlagen mit Anzeigename, Komponente und Layout-Eckdaten.
import { Type } from '@angular/core';
import type { TemplateId } from '@shared/cv/cv-data';
import { TemplateBanner } from './banner/template-banner';
import { TemplateClassic } from './classic/template-classic';
import { TemplateElegant } from './elegant/template-elegant';
import { TemplateMinimal } from './minimal/template-minimal';
import { TemplateModern } from './modern/template-modern';

/** Beschreibung einer Vorlage, wie sie Auswahl im Editor und `TemplateHost` benötigen. */
export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  supportsPhoto: boolean;
  component: Type<unknown>;
  /** Horizontale Ränder (mm) der Inhaltsspalte, an der sich die Seitenzahl ausrichtet. */
  pageNumberInset: { left: number; right: number };
}

/** Alle verfügbaren Vorlagen; der erste Eintrag ist zugleich der Standard. */
export const TEMPLATE_REGISTRY: readonly TemplateDefinition[] = [
  { id: 'classic', name: 'Klassisch', supportsPhoto: true, component: TemplateClassic, pageNumberInset: { left: 18, right: 18 } },
  { id: 'modern', name: 'Modern', supportsPhoto: true, component: TemplateModern, pageNumberInset: { left: 74, right: 12 } },
  { id: 'minimal', name: 'Minimal', supportsPhoto: true, component: TemplateMinimal, pageNumberInset: { left: 20, right: 20 } },
  { id: 'elegant', name: 'Elegant', supportsPhoto: true, component: TemplateElegant, pageNumberInset: { left: 18, right: 18 } },
  { id: 'banner', name: 'Banner', supportsPhoto: true, component: TemplateBanner, pageNumberInset: { left: 18, right: 18 } },
];

/** Sucht eine Vorlage per ID; unbekannte IDs fallen auf die Standardvorlage zurück. */
export function findTemplate(id: string): TemplateDefinition {
  return TEMPLATE_REGISTRY.find((item) => item.id === id) ?? TEMPLATE_REGISTRY[0];
}

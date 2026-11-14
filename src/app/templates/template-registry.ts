// Verzeichnis aller Lebenslauf-Vorlagen mit Anzeigename, Komponente und Layout-Eckdaten.
// Die Komponenten werden erst bei Bedarf geladen (eigene Chunks); Name, Foto-Form usw. stehen sofort bereit.
import { Type } from '@angular/core';
import type { TemplateId } from '@shared/cv/cv-data';

/** Beschreibung einer Vorlage, wie sie Auswahl im Editor und `TemplateHost` benötigen. */
export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  supportsPhoto: boolean;
  /** Lädt die Komponente der Vorlage nach. */
  load: () => Promise<Type<unknown>>;
  /** Horizontale Ränder (mm) der Inhaltsspalte, an der sich die Seitenzahl ausrichtet. */
  pageNumberInset: { left: number; right: number };
  /** Seitenverhältnis (Breite/Höhe) und Form des Fotos – Vorgabe für den Zuschnitt. */
  photo: { aspect: number; round: boolean };
}

/** Alle verfügbaren Vorlagen; der erste Eintrag ist zugleich der Standard. */
export const TEMPLATE_REGISTRY: readonly TemplateDefinition[] = [
  { id: 'classic', name: 'Klassisch', supportsPhoto: true, load: () => import('./classic/template-classic').then((m) => m.TemplateClassic), pageNumberInset: { left: 18, right: 18 }, photo: { aspect: 30 / 38, round: false } },
  { id: 'modern', name: 'Modern', supportsPhoto: true, load: () => import('./modern/template-modern').then((m) => m.TemplateModern), pageNumberInset: { left: 74, right: 12 }, photo: { aspect: 1, round: true } },
  { id: 'minimal', name: 'Minimal', supportsPhoto: true, load: () => import('./minimal/template-minimal').then((m) => m.TemplateMinimal), pageNumberInset: { left: 20, right: 20 }, photo: { aspect: 1, round: true } },
  { id: 'elegant', name: 'Elegant', supportsPhoto: true, load: () => import('./elegant/template-elegant').then((m) => m.TemplateElegant), pageNumberInset: { left: 18, right: 18 }, photo: { aspect: 1, round: true } },
  { id: 'banner', name: 'Banner', supportsPhoto: true, load: () => import('./banner/template-banner').then((m) => m.TemplateBanner), pageNumberInset: { left: 18, right: 18 }, photo: { aspect: 30 / 38, round: false } },
];

/** Sucht eine Vorlage per ID; unbekannte IDs fallen auf die Standardvorlage zurück. */
export function findTemplate(id: string): TemplateDefinition {
  return TEMPLATE_REGISTRY.find((item) => item.id === id) ?? TEMPLATE_REGISTRY[0];
}

/** Bereits geladene Vorlagen-Komponenten. */
const loaded = new Map<TemplateId, Type<unknown>>();

/** Komponente einer Vorlage, falls schon geladen; sonst `null`. */
export function loadedTemplate(id: string): Type<unknown> | null {
  return loaded.get(findTemplate(id).id) ?? null;
}

/** Lädt die Komponente einer Vorlage (einmal) und liefert sie. */
export async function loadTemplate(id: string): Promise<Type<unknown>> {
  const definition = findTemplate(id);
  const cached = loaded.get(definition.id);
  if (cached) {
    return cached;
  }
  const component = await definition.load();
  loaded.set(definition.id, component);
  return component;
}

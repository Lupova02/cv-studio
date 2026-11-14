// Kuratierte Akzentfarben für die Vorlagen. Jede erreicht mit weißer Schrift mindestens WCAG AA (4,5:1),
// damit z. B. das Kopfband von „Banner“ und die Seitenleiste von „Modern“ gut lesbar bleiben (siehe Test).
import type { CvLanguage } from '../cv/cv-data';

export interface AccentPreset {
  color: string;
  name: Record<CvLanguage, string>;
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { color: '#1f4b99', name: { de: 'Blau', en: 'Blue', tr: 'Mavi' } },
  { color: '#4338ca', name: { de: 'Indigo', en: 'Indigo', tr: 'Çivit' } },
  { color: '#0e7490', name: { de: 'Petrol', en: 'Teal', tr: 'Petrol' } },
  { color: '#1d6b3a', name: { de: 'Grün', en: 'Green', tr: 'Yeşil' } },
  { color: '#a4470d', name: { de: 'Kupfer', en: 'Copper', tr: 'Bakır' } },
  { color: '#9b2335', name: { de: 'Weinrot', en: 'Burgundy', tr: 'Bordo' } },
  { color: '#6b2a6b', name: { de: 'Aubergine', en: 'Plum', tr: 'Patlıcan' } },
  { color: '#3d4756', name: { de: 'Graphit', en: 'Graphite', tr: 'Grafit' } },
];

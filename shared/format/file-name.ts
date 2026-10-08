// Vorschlag für Dateinamen beim Speichern (z. B. PDF-Export), abgeleitet aus dem Namen im Lebenslauf.
import type { CvData } from '../cv/cv-data';

/** Dateiname ohne Endung aus Vor- und Nachname, z. B. 'Daniel-Kaya'; nur ASCII-Buchstaben, Ziffern und Bindestriche, sonst 'Lebenslauf'. */
export function suggestFileBase(data: CvData): string {
  const raw = [data.personal.firstName, data.personal.lastName].join('-');
  // Akzente abtrennen und entfernen (é → e), alles andere Unzulässige zu einem Bindestrich zusammenfassen.
  // ß, ı und İ zerfallen bei NFKD nicht in Grundbuchstabe + Akzent und werden deshalb vorher ersetzt.
  const cleaned = raw
    .replace(/ß/g, 'ss')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'Lebenslauf';
}

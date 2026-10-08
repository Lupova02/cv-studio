// Hilfe für die Katalog-Suche: Manche Suchschlüssel sind umschrieben ('anfaenger', 'fliessend'),
// andere nur ohne Umlautpunkte ('franzosisch'). Die Suche probiert deshalb beide Schreibweisen.

/** Schreibt ä/ö/ü als ae/oe/ue und ß als ss, z. B. 'Fließend' → 'fliessend' (kleingeschrieben). */
export function umlautSpelling(value: string): string {
  return value.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

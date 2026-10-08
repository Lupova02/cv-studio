// Farb-Hilfe für die Vorlagen: lesbare Textfarbe auf der vom Nutzer gewählten Akzentfarbe.

/** Liefert Schwarz oder Weiß als Textfarbe, je nachdem, was auf der Akzentfarbe (Hex '#rrggbb') besser lesbar ist; bei ungültiger Farbe Weiß. */
export function onAccentColor(hex: string): '#111111' | '#ffffff' {
  const value = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return '#ffffff';
  }
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  // Gewichtete Helligkeit nach Rec. 709 (Grün wirkt am hellsten); erst ab recht hellen Farben wird dunkler Text gewählt.
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.62 ? '#111111' : '#ffffff';
}

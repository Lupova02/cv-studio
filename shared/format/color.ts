// Farb-Hilfen: lesbare Textfarbe auf der vom Nutzer gewählten Akzentfarbe und Kontrastberechnung nach WCAG 2.

/** Zerlegt '#rrggbb' in Rot, Grün, Blau (0–255); `null` bei ungültiger Farbe. */
function channels(hex: string): [number, number, number] | null {
  const value = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }
  return [0, 2, 4].map((start) => Number.parseInt(value.slice(start, start + 2), 16)) as [number, number, number];
}

/** Relative Leuchtdichte nach WCAG 2 (0 = Schwarz, 1 = Weiß); `null` bei ungültiger Farbe. */
export function relativeLuminance(hex: string): number | null {
  const rgb = channels(hex);
  if (!rgb) {
    return null;
  }
  const [red, green, blue] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Kontrastverhältnis zweier Farben nach WCAG 2 (1–21); `null` bei ungültiger Farbe. */
export function contrastRatio(first: string, second: string): number | null {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  if (a === null || b === null) {
    return null;
  }
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Liefert Schwarz oder Weiß als Textfarbe – je nachdem, welche auf der Akzentfarbe (Hex '#rrggbb')
 * den höheren Kontrast nach WCAG hat; bei ungültiger Farbe Weiß.
 */
export function onAccentColor(hex: string): '#111111' | '#ffffff' {
  const dark = contrastRatio(hex, '#111111');
  const light = contrastRatio(hex, '#ffffff');
  if (dark === null || light === null) {
    return '#ffffff';
  }
  return dark > light ? '#111111' : '#ffffff';
}

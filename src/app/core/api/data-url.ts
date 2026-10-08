/** Wandelt eine Base64-Data-URL (z. B. Foto aus einer Sicherung) in einen Blob mit passendem MIME-Typ um. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const type = /^data:([^;,]+)/.exec(dataUrl)?.[1] ?? 'application/octet-stream';
  const bytes = Uint8Array.from(atob(dataUrl.slice(comma + 1)), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

export function buildFilename(...parts: (string | number)[]): string {
  return parts
    .map((p) => String(p).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_'))
    .join('_')
    .replace(/^_|_$/g, '') + '.pdf';
}

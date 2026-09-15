const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_EXPORT_ROWS = 5000;

function toPositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.trunc(parsed);
}

export function parsePageSize(
  raw: string | null,
  fallback: number = DEFAULT_PAGE_SIZE
): number {
  return Math.min(MAX_PAGE_SIZE, toPositiveInt(raw, fallback));
}

export function parsePageIndex(raw: string | null): number {
  const parsed = Number(raw ?? "0");
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
}

export function parsePageNumber(raw: string | null): number {
  return toPositiveInt(raw, 1);
}

export function parseExportLimit(raw: string | null): number {
  return Math.min(MAX_EXPORT_ROWS, toPositiveInt(raw, MAX_EXPORT_ROWS));
}

export { MAX_EXPORT_ROWS, MAX_PAGE_SIZE };

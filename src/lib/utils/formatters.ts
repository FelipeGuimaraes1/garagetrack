/** Formata número em moeda BRL (R$ 1.234,56) */
export function formatCurrencyBRL(value: number | string): string {
  const number = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(number)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

/** Converte string de moeda BR ("1.234,56" ou "R$ 1.234,56") em número */
export function parseCurrencyBRL(input: string): number {
  const onlyDigits = input
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(onlyDigits);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Formata Date em yyyy-mm-dd (útil para inputs do tipo date) */
export function formatDateISO(date: Date): string {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formata uma data (Date ou string compatível com Date)
 * em DD/MM/AAAA SEM deslocamento de fuso (UTC “fixo”).
 * Útil para campos DATE do banco (sem hora).
 */
export function formatDateBR(dateLike: Date | string): string {
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  // Força UTC para evitar “andar” um dia para trás em fuso -03:00
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

/** Tenta criar Date a partir de yyyy-mm-dd (ou dd/mm/yyyy) */
export function parseDate(input: string): Date | null {
  if (!input) return null;
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split("-").map(Number);
    // cria no fuso local (útil para inputs <input type="date">)
    return new Date(y, m - 1, d);
  }
  // dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [d, m, y] = input.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  const dt = new Date(input);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Normaliza placa (remove espaços, põe maiúsculas). Não valida formato Mercosul estrito. */
export function normalizePlate(plate: string): string {
  return (plate || "").toUpperCase().replace(/\s+/g, "");
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
export function subMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() - n, 1);
}

/** formata para "YYYY-MM" quando type='month'; senão ISO date padrão */
export function formatISO(d: Date, type: "date" | "month" = "date") {
  if (type === "month") {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  return d.toISOString();
}

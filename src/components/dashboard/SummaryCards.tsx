"use client";

import { formatCurrencyBRL } from "@/lib/utils/formatters";

export function SummaryCards(props: {
  totalThisMonth: number;
  totalPrevMonth: number;
  avgTicketThisMonth: number;
  countThisMonth: number;
}) {
  const { totalThisMonth, totalPrevMonth, avgTicketThisMonth, countThisMonth } =
    props;
  const diff = totalThisMonth - totalPrevMonth;
  const pct = totalPrevMonth ? (diff / totalPrevMonth) * 100 : 0;
  const up = pct >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card title="Gasto do mês" value={formatCurrencyBRL(totalThisMonth)} />
      <Card
        title="Variação vs mês anterior"
        value={`${up ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%`}
        hint={`${formatCurrencyBRL(totalPrevMonth)} → ${formatCurrencyBRL(
          totalThisMonth
        )}`}
      />
      <Card
        title="Ticket médio"
        value={formatCurrencyBRL(avgTicketThisMonth)}
        hint={`${countThisMonth} lanç.`}
      />
      <Card title="Lançamentos no mês" value={String(countThisMonth)} />
    </div>
  );
}

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface p-4">
      <div className="text-sm text-[var(--muted)]">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint ? (
        <div className="text-xs text-[var(--muted)] mt-1">{hint}</div>
      ) : null}
    </div>
  );
}

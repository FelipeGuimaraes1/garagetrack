"use client";

import { formatCurrencyBRL } from "@/lib/utils/formatters";

type Item = { label: string; value: number };
export function BarChart({ data, title }: { data: Item[]; title: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="surface p-4">
      <div className="mb-3 text-sm text-[var(--muted)]">{title}</div>
      <div className="grid gap-2">
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={d.label}>
              <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                <span className="truncate">{d.label}</span>
                <span>{formatCurrencyBRL(d.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 border border-[var(--border)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: "var(--accent)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

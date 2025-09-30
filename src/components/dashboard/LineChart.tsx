"use client";

import { formatCurrencyBRL } from "@/lib/utils/formatters";

type Point = { label: string; value: number };

export function LineChart({ data, title }: { data: Point[]; title: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 600,
    h = 180,
    pad = 24;
  const step = (w - pad * 2) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = pad + i * step;
    const y = pad + (1 - d.value / max) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <div className="surface p-4">
      <div className="mb-3 text-sm text-[var(--muted)]">{title}</div>
      <div className="overflow-x-auto">
        <svg width={w} height={h} className="min-w-full">
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            points={points.join(" ")}
          />
          {data.map((d, i) => {
            const x = pad + i * step;
            const y = pad + (1 - d.value / max) * (h - pad * 2);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3" fill="var(--accent)" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
        {data.map((d, i) => (
          <div key={i} className="text-xs text-[var(--muted)]">
            <div>{d.label}</div>
            <div className="font-medium">{formatCurrencyBRL(d.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

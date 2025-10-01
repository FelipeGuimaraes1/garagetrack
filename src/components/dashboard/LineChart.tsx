"use client";

import { useMemo, useState } from "react";

/**
 * Componente de linha simples em SVG, responsivo.
 * - Eixo X compacto (MM/YY)
 * - Até 6 rótulos no eixo X para evitar poluição visual
 * - Valores aparecem no tooltip de hover
 * - Grid leve
 */
export function LineChart({
  title,
  data,
  height = 260,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
  height?: number;
}) {
  // Normaliza labels "YYYY-MM" -> "MM/YY"
  function compactLabel(lbl: string) {
    // aceita "YYYY-MM" ou qualquer string; se não casar, retorna direto
    const m = /^(\d{4})-(\d{2})$/.exec(lbl);
    if (!m) return lbl;
    const yy = m[1].slice(-2);
    const mm = m[2];
    return `${mm}/${yy}`;
  }

  // Evita array vazio
  const safeData = data && data.length ? data : [{ label: "—", value: 0 }];

  // Escalas
  const padding = { top: 20, right: 16, bottom: 36, left: 16 };
  const innerH = height - padding.top - padding.bottom;
  const innerW = 600 - padding.left - padding.right; // viewBox fixo; escala por preserveAspectRatio

  const values = safeData.map((d) => d.value);
  const minV = Math.min(...values, 0);
  const maxV = Math.max(...values, 1);

  function yScale(v: number) {
    const t = (v - minV) / (maxV - minV || 1);
    return padding.top + (1 - t) * innerH;
  }
  function xScale(i: number) {
    if (safeData.length === 1) return padding.left + innerW / 2;
    return padding.left + (i / (safeData.length - 1)) * innerW;
  }

  // Define quais labels mostrar (no máx 6)
  const labelIdxs = useMemo(() => {
    const n = safeData.length;
    if (n <= 6) return [...Array(n).keys()];
    const step = Math.ceil(n / 6);
    const arr: number[] = [];
    for (let i = 0; i < n; i += step) arr.push(i);
    if (arr[arr.length - 1] !== n - 1) arr.push(n - 1);
    return arr;
  }, [safeData.length]);

  // Path da linha
  const path = useMemo(() => {
    return safeData
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.value)}`)
      .join(" ");
  }, [safeData]);

  // Grid (5 linhas horizontais)
  const gridLines = useMemo(() => {
    const lines: number[] = [];
    const rows = 5;
    for (let r = 0; r <= rows; r++) {
      const y = padding.top + (r / rows) * innerH;
      lines.push(y);
    }
    return lines;
  }, [innerH]);

  // Tooltip simples
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
  } | null>(null);
  const currency = (v: number) =>
    v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    });

  return (
    <div className="surface p-4 rounded-xl border border-[var(--border)] overflow-hidden">
      <h3 className="font-semibold mb-2">{title}</h3>

      <div className="relative">
        <svg
          viewBox="0 0 600 260"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto block select-none"
          aria-label={title}
        >
          {/* grid */}
          <g stroke="rgba(255,255,255,.06)">
            {gridLines.map((y, idx) => (
              <line
                key={idx}
                x1={padding.left}
                x2={padding.left + innerW}
                y1={y}
                y2={y}
              />
            ))}
          </g>

          {/* linha */}
          <path
            d={path}
            fill="none"
            stroke="var(--accent, #22D3EE)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* pontos */}
          {safeData.map((d, i) => {
            const cx = xScale(i);
            const cy = yScale(d.value);
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={4} fill="var(--accent, #22D3EE)" />
                {/* área de hover maior para capturar o mouse */}
                <rect
                  x={cx - 16}
                  y={padding.top}
                  width={32}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() =>
                    setHover({ x: cx, y: cy, label: d.label, value: d.value })
                  }
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}

          {/* eixo X com labels compactos */}
          <g fill="var(--muted)" fontSize="10">
            {labelIdxs.map((i) => {
              const x = xScale(i);
              const y = height - 12;
              return (
                <text key={i} x={x} y={y} textAnchor="middle">
                  {compactLabel(safeData[i].label)}
                </text>
              );
            })}
          </g>
        </svg>

        {/* tooltip */}
        {hover && (
          <div
            className="absolute pointer-events-none px-2 py-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg"
            style={{
              left: `min(calc(100% - 140px), max(8px, ${hover.x}px))`,
              top: Math.max(8, hover.y - 36),
              transform: "translateX(-50%)",
            }}
          >
            <div className="opacity-80">{compactLabel(hover.label)}</div>
            <div className="font-semibold">{currency(hover.value)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

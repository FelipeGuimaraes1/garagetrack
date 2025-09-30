// src/app/dashboard/page.tsx
"use client";

import { BarChart } from "@/components/dashboard/BarChart";
import { LineChart } from "@/components/dashboard/LineChart";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { useToast } from "@/hooks/useToast";
import { useEffect, useState } from "react";

type ApiData = {
  monthISO: string;
  totalThisMonth: number;
  totalPrevMonth: number;
  avgTicketThisMonth: number;
  countThisMonth: number;
  byVehicle: Array<{ vehicleId: string; label: string; total: number }>;
  lastMonths: Array<{ monthISO: string; total: number }>;
};

export default function DashboardPage() {
  const { showToast } = useToast();

  // mês selecionado no formato YYYY-MM (controla a API)
  const [month, setMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(m: string) {
    try {
      setLoading(true);
      const url = `/api/analytics?month=${encodeURIComponent(m)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar os dados.");
      const json: ApiData = await res.json();
      setData(json);
    } catch (e: any) {
      showToast(e.message || "Falha ao carregar dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  // Carrega sempre que o mês mudar
  useEffect(() => {
    void load(month);
  }, [month]);

  // utilitários para navegar entre meses
  function addMonths(ym: string, delta: number) {
    const [y, m] = ym.split("-").map((n) => parseInt(n, 10));
    const d = new Date(y, m - 1 + delta, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
    // termo: addMonths = função que soma/subtrai meses preservando o formato
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        <Header
          month={month}
          onChangeMonth={setMonth}
          onPrev={() => setMonth((m) => addMonths(m, -1))}
          onNext={() => setMonth((m) => addMonths(m, +1))}
        />
        <div className="surface p-4">Carregando dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4">
        <Header
          month={month}
          onChangeMonth={setMonth}
          onPrev={() => setMonth((m) => addMonths(m, -1))}
          onNext={() => setMonth((m) => addMonths(m, +1))}
        />
        <div className="surface p-4">Sem dados para exibir.</div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Header
        month={month}
        onChangeMonth={setMonth}
        onPrev={() => setMonth((m) => addMonths(m, -1))}
        onNext={() => setMonth((m) => addMonths(m, +1))}
      />

      <SummaryCards
        totalThisMonth={data.totalThisMonth}
        totalPrevMonth={data.totalPrevMonth}
        avgTicketThisMonth={data.avgTicketThisMonth}
        countThisMonth={data.countThisMonth}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart
          title={`Gasto por veículo (${data.monthISO})`}
          data={data.byVehicle.map((x) => ({ label: x.label, value: x.total }))}
        />
        <LineChart
          title="Gasto nos últimos 6 meses"
          data={data.lastMonths.map((m) => ({
            label: m.monthISO,
            value: m.total,
          }))}
        />
      </div>
    </div>
  );
}

function Header({
  month,
  onChangeMonth,
  onPrev,
  onNext,
}: {
  month: string;
  onChangeMonth: (m: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="surface p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
          aria-label="Mês anterior"
          title="Mês anterior"
        >
          «
        </button>

        <label className="sr-only" htmlFor="month-input">
          Selecione o mês
        </label>
        <input
          id="month-input"
          type="month"
          value={month}
          onChange={(e) => onChangeMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-white/10"
        />

        <button
          onClick={onNext}
          className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
          aria-label="Próximo mês"
          title="Próximo mês"
        >
          »
        </button>
      </div>
    </div>
  );
}

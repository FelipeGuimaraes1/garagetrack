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
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics", { cache: "no-store" });
      const json: ApiData = await res.json();
      setData(json);
    } catch (e: any) {
      showToast(e.message || "Falha ao carregar dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading)
    return <div className="surface p-4">Carregando dashboard...</div>;
  if (!data) return <div className="surface p-4">Sem dados para exibir.</div>;

  return (
    <div className="grid gap-4">
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

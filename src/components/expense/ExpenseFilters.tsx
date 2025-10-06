"use client";

import { useExpenses } from "@/hooks/useExpenses";
import { useVehicles } from "@/hooks/useVehicles";
import { useState } from "react";

const expenseTypes = [
  "ABASTECIMENTO",
  "MANUTENCAO",
  "IMPOSTO",
  "SEGURO",
  "MULTA",
  "OUTRO",
] as const;

export function ExpenseFilters() {
  const { vehicles } = useVehicles();
  const { filters, reload } = useExpenses();

  // Estados locais iniciam com os filtros atuais do hook
  const [vehicleId, setVehicleId] = useState<string>(filters.vehicleId || "");
  const [type, setType] = useState<string>(filters.type || "");
  const [dateFrom, setDateFrom] = useState<string>(filters.dateFrom || "");
  const [dateTo, setDateTo] = useState<string>(filters.dateTo || "");

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    void reload({
      page: 1,
      vehicleId: vehicleId || undefined,
      type: (type || undefined) as any,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }

  function clearFilters() {
    setVehicleId("");
    setType("");
    setDateFrom("");
    setDateTo("");
    void reload({
      page: 1,
      vehicleId: undefined,
      type: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  }

  /** Monta a URL de export respeitando os filtros atuais (da UI local). */
  function buildExportUrl(): string {
    const params = new URLSearchParams();
    if (vehicleId) params.set("vehicleId", vehicleId);
    if (type) params.set("type", type);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    // pode ajustar limite aqui se necessário: params.set("limit","50000")
    return `/api/expenses/export?${params.toString()}`;
  }

  function exportCsv() {
    // Força download criando um link temporário
    const url = buildExportUrl();
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = ""; // filename é definido no header da resposta
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <form onSubmit={applyFilters} className="surface p-4 grid gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Veículo</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
          >
            <option value="">Todos</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname || vehicle.plate || "Sem apelido"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
          >
            <option value="">Todos</option>
            {expenseTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-end">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 cursor-pointer"
          >
            Limpar
          </button>
          <button type="submit" className="button-primary cursor-pointer">
            Aplicar
          </button>
        </div>

        <div className="grow" />

        <button
          type="button"
          onClick={exportCsv}
          className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 cursor-pointer"
          aria-label="Exportar CSV"
          title="Exportar CSV (respeitando os filtros)"
        >
          Exportar CSV
        </button>
      </div>
    </form>
  );
}

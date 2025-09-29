"use client";

import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrencyBRL } from "@/lib/utils/formatters";

export function ExpenseList() {
  const { expenses, isLoading, errorMessage, totalPages, filters, reload } =
    useExpenses();

  if (isLoading)
    return <div className="surface p-4">Carregando despesas...</div>;
  if (errorMessage)
    return (
      <div className="surface p-4 text-[var(--danger)]">{errorMessage}</div>
    );
  if (!expenses.length) {
    return (
      <div className="surface p-6 text-center text-[var(--muted)]">
        Nenhuma despesa encontrada.
      </div>
    );
  }

  function go(page: number) {
    void reload({ page });
  }

  return (
    <div className="grid gap-3">
      <ul className="grid gap-3">
        {expenses.map((e) => (
          <li key={e.id} className="surface p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">
                  {e.type}{" "}
                  <span className="text-sm text-[var(--muted)]">
                    · {new Date(e.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {e.description}
                  {e.km != null ? ` · ${e.km} km` : ""}
                  {e.vehicle?.nickname || e.vehicle?.plate
                    ? ` · ${e.vehicle.nickname || e.vehicle.plate}`
                    : ""}
                </div>
              </div>
              <div className="font-semibold">{formatCurrencyBRL(e.amount)}</div>
            </div>

            {e.type === "ABASTECIMENTO" && (e.fuelLiters || e.pricePerLiter) ? (
              <div className="text-sm text-[var(--muted)] mt-1">
                {e.fuelLiters ? `${e.fuelLiters} L` : ""}{" "}
                {e.pricePerLiter
                  ? ` · ${formatCurrencyBRL(Number(e.pricePerLiter))}/L`
                  : ""}
                {e.fuelType ? ` · ${e.fuelType}` : ""}{" "}
                {e.station ? ` · ${e.station}` : ""}
              </div>
            ) : null}

            {e.attachments?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {e.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    className="px-2 py-1 text-sm rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
                  >
                    Anexo
                  </a>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => go(Math.max(1, (filters.page || 1) - 1))}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
          >
            ←
          </button>
          <div className="text-sm">
            Página {filters.page} de {totalPages}
          </div>
          <button
            onClick={() => go(Math.min(totalPages, (filters.page || 1) + 1))}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

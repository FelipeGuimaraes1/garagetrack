"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { emitAppEvent, onAppEvent } from "@/lib/utils/events";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils/formatters";
import { Edit2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ExpenseEditModal } from "./ExpenseEditModal";

/**
 * Tipagem mínima necessária para renderização da lista de despesas.
 */
type ExpenseLike = {
  id: string;
  type: string;
  date: string | Date;
  description: string;
  amount: number | string;
  km?: number | string | null; // agora também guarda snapshot do odômetro em MANUTENCAO
  fuelLiters?: number | string | null;
  pricePerLiter?: number | string | null;
  fuelType?: string | null;
  station?: string | null;
  vehicle?: {
    nickname?: string | null;
    plate?: string | null;
  } | null;
  attachments?: Array<{ id: string; url: string }> | null;
};

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value as any);
  return Number.isFinite(n) ? n : null;
}

export function ExpenseList() {
  const {
    expenses,
    isLoading,
    errorMessage,
    totalPages,
    filters,
    reload,
    deleteExpense,
  } = useExpenses();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const off = onAppEvent("gt:expenses:changed", () => {
      void reload();
    });
    return off;
  }, [reload]);

  const expensesList: ExpenseLike[] = useMemo(() => {
    if (Array.isArray(expenses)) return expenses as ExpenseLike[];
    if (expenses && Array.isArray((expenses as any).data)) {
      return (expenses as any).data as ExpenseLike[];
    }
    return [];
  }, [expenses]);

  if (isLoading) {
    return <div className="surface p-4">Carregando despesas...</div>;
  }
  if (errorMessage) {
    return (
      <div className="surface p-4 text-[var(--danger)]">{errorMessage}</div>
    );
  }
  if (!expensesList.length) {
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
        {expensesList.map((expense: ExpenseLike) => {
          const amountNumber = toNumber(expense.amount);
          const kmNumber = toNumber(expense.km);
          const fuelLitersNumber = toNumber(expense.fuelLiters);
          const pricePerLiterNumber = toNumber(expense.pricePerLiter);

          const isManutencao = expense.type === "MANUTENCAO";

          return (
            <li key={expense.id} className="surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">
                    {expense.type}{" "}
                    <span className="text-sm text-[var(--muted)]">
                      · {formatDateBR(expense.date)}
                    </span>
                  </div>

                  <div className="text-sm text-[var(--muted)]">
                    {expense.description}
                    {/* Veículo */}
                    {expense.vehicle?.nickname || expense.vehicle?.plate
                      ? ` · ${
                          expense.vehicle.nickname || expense.vehicle.plate
                        }`
                      : ""}
                    {/* KM:
                        - ABASTECIMENTO: usa km como “trip” (comportamento antigo)
                        - MANUTENCAO: mostra snapshot do odômetro salvo em km */}
                    {kmNumber != null
                      ? isManutencao
                        ? ` · Odômetro: ${kmNumber} km`
                        : ` · ${kmNumber} km`
                      : ""}
                  </div>

                  {/* Bloco extra p/ abastecimento (litros, R$/L, etc) */}
                  {expense.type === "ABASTECIMENTO" &&
                  (fuelLitersNumber != null || pricePerLiterNumber != null) ? (
                    <>
                      <div className="text-sm text-[var(--muted)] mt-1">
                        {fuelLitersNumber != null
                          ? `${fuelLitersNumber} L`
                          : ""}{" "}
                        {pricePerLiterNumber != null
                          ? ` · ${formatCurrencyBRL(pricePerLiterNumber)}/L`
                          : ""}{" "}
                        {expense.fuelType ? ` · ${expense.fuelType}` : ""}{" "}
                        {expense.station ? ` · ${expense.station}` : ""}
                      </div>
                      {fuelLitersNumber && kmNumber ? (
                        <div className="text-sm text-[var(--muted)] mt-1">
                          Consumo: {(kmNumber / fuelLitersNumber).toFixed(2)}{" "}
                          km/L
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {expense.attachments?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {expense.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          className="px-2 py-1 text-sm rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
                        >
                          Anexo
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="text-right">
                  <div className="font-semibold">
                    {amountNumber != null
                      ? formatCurrencyBRL(amountNumber)
                      : "—"}
                  </div>
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(expense.id)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setRemovingId(expense.id)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm cursor-pointer"
                    >
                      <Trash2 size={16} className="text-[var(--danger)]" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
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

      {/* Modal de edição */}
      <ExpenseEditModal
        expenseId={editingId}
        open={Boolean(editingId)}
        onClose={() => setEditingId(null)}
        onSaved={async () => {
          await reload();
        }}
      />

      {/* Confirmação de remoção */}
      <ConfirmDialog
        open={Boolean(removingId)}
        title="Remover despesa"
        description="Esta ação não pode ser desfeita. Deseja realmente remover esta despesa?"
        confirmText="Remover"
        onCancel={() => setRemovingId(null)}
        onConfirm={async () => {
          if (!removingId) return;
          try {
            await deleteExpense(removingId);
            emitAppEvent("gt:expenses:changed");
            showToast("Despesa removida!", "success");
            await reload();
          } catch (error: any) {
            showToast(error?.message || "Falha ao remover despesa.", "error");
          } finally {
            setRemovingId(null);
          }
        }}
      />
    </div>
  );
}

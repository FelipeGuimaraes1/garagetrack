"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Expense = {
  id: string;
  userId: string;
  vehicleId: string;
  type:
    | "ABASTECIMENTO"
    | "MANUTENCAO"
    | "IMPOSTO"
    | "SEGURO"
    | "MULTA"
    | "OUTRO";
  status: "PAGO" | "PENDENTE";
  date: string; // ISO
  amount: number | string;
  description: string;
  km: number | null;

  fuelLiters?: number | null;
  pricePerLiter?: number | null;
  fuelType?: "GASOLINA" | "ETANOL" | "DIESEL" | "GNV" | null;
  station?: string | null;

  vehicle?: {
    id: string;
    nickname: string | null;
    plate: string | null;
  } | null;

  attachments?: { id: string; url: string }[];
  createdAt: string;
  updatedAt: string;
};

export type ExpenseFilters = {
  page?: number;
  vehicleId?: string;
  type?: Expense["type"] | "";
  dateFrom?: string;
  dateTo?: string;
};

type CreateInput = Record<string, any>;
type UpdateInput = Partial<CreateInput>;

function normalizeList(payload: any): Expense[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function useExpenses(initialFilters: ExpenseFilters = { page: 1 }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ExpenseFilters>({
    page: initialFilters.page ?? 1,
  });

  const load = useCallback(
    async (next?: ExpenseFilters) => {
      const merged = { ...filters, ...(next || {}) };
      setFilters(merged);
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const qs = new URLSearchParams();
        if (merged.page) qs.set("page", String(merged.page));
        if (merged.vehicleId) qs.set("vehicleId", merged.vehicleId);
        if (merged.type) qs.set("type", merged.type);
        if (merged.dateFrom) qs.set("dateFrom", merged.dateFrom);
        if (merged.dateTo) qs.set("dateTo", merged.dateTo);

        const res = await fetch(`/api/expenses?${qs.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });
        const json = await safeJson(res);
        if (!res.ok)
          throw new Error(json?.message || "Falha ao carregar despesas.");

        setExpenses(normalizeList(json));
        setTotalPages(Number(json?.totalPages || 1));
        if (json?.page) setFilters((f) => ({ ...f, page: json.page }));
      } catch (e: any) {
        setErrorMessage(e?.message || "Erro ao buscar despesas.");
        setExpenses([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void load();
  }, []); // primeira carga

  /** Agora retorna { expense, alerts } para que a UI possa mostrar o aviso */
  const createExpense = useCallback(async (input: CreateInput) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const json = await safeJson(res);

    if (!res.ok) {
      const err: any = new Error(json?.message || "Erro ao criar despesa.");
      err.status = res.status;
      err.payload = json;
      throw err;
    }

    const created: Expense = json?.data ?? json;
    setExpenses((prev) => [created, ...prev]);
    return { expense: created, alerts: (json?.alerts as any[]) ?? [] };
  }, []);

  const updateExpense = useCallback(async (id: string, input: UpdateInput) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const json = await safeJson(res);

    if (!res.ok) {
      const err: any = new Error(json?.message || "Erro ao atualizar despesa.");
      err.status = res.status;
      err.payload = json;
      throw err;
    }

    const updated: Expense = json?.data ?? json;
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await safeJson(res);
    if (!res.ok) throw new Error(json?.message || "Erro ao excluir despesa.");
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const helpers = useMemo(
    () => ({
      reload: (next?: ExpenseFilters) => load(next),
      createExpense,
      updateExpense,
      deleteExpense,
    }),
    [load, createExpense, updateExpense, deleteExpense]
  );

  return { expenses, isLoading, errorMessage, totalPages, filters, ...helpers };
}

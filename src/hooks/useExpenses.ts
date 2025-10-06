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
  amount: number | string; // pode vir como Decimal serializado
  description: string;
  km: number | string | null;

  // abastecimento
  fuelLiters?: number | string | null;
  pricePerLiter?: number | string | null;
  fuelType?: "GASOLINA" | "ETANOL" | "DIESEL" | "GNV" | null;
  station?: string | null;

  // join opcional
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
  page?: number; // 1-based
  pageSize?: number; // default 10
  vehicleId?: string; // filtro por veículo
  type?: Expense["type"]; // filtro por tipo
  dateFrom?: string; // "YYYY-MM-DD"
  dateTo?: string; // "YYYY-MM-DD"
};

type CreateInput = Omit<
  Expense,
  "id" | "userId" | "createdAt" | "updatedAt" | "vehicle" | "attachments"
> & {
  attachments?: {
    url: string;
    contentType?: string | null;
    size?: number | null;
  }[];
};

type UpdateInput = Partial<CreateInput>;

/** Normaliza resposta em formatos variados. */
function normalizeExpenseResponse(
  payload: any,
  fallbackPageSize: number
): { items: Expense[]; page: number; totalPages: number } {
  // itens
  const items: Expense[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.results)
    ? payload.results
    : [];

  // paginação
  const page = Number(payload?.page) || Number(payload?.pagination?.page) || 1;

  const totalPagesFromPayload =
    Number(payload?.totalPages) || Number(payload?.pagination?.totalPages) || 0;

  const totalPages =
    totalPagesFromPayload ||
    (typeof payload?.totalCount === "number"
      ? Math.max(1, Math.ceil(payload.totalCount / (fallbackPageSize || 10)))
      : 1);

  return { items, page, totalPages };
}

export function useExpenses(
  initialFilters: ExpenseFilters = { page: 1, pageSize: 10 }
) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ExpenseFilters>({
    page: initialFilters.page ?? 1,
    pageSize: initialFilters.pageSize ?? 10,
    vehicleId: initialFilters.vehicleId,
    type: initialFilters.type,
    dateFrom: initialFilters.dateFrom,
    dateTo: initialFilters.dateTo,
  });

  const load = useCallback(
    async (nextFilters?: ExpenseFilters) => {
      const mergedFilters = { ...filters, ...(nextFilters || {}) };
      setFilters(mergedFilters);
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const queryString = new URLSearchParams();
        if (mergedFilters.page)
          queryString.set("page", String(mergedFilters.page));
        if (mergedFilters.pageSize)
          queryString.set("pageSize", String(mergedFilters.pageSize));
        if (mergedFilters.vehicleId)
          queryString.set("vehicleId", mergedFilters.vehicleId);
        if (mergedFilters.type) queryString.set("type", mergedFilters.type);
        if (mergedFilters.dateFrom)
          queryString.set("dateFrom", mergedFilters.dateFrom);
        if (mergedFilters.dateTo)
          queryString.set("dateTo", mergedFilters.dateTo);

        const response = await fetch(
          `/api/expenses?${queryString.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(text || "Falha ao carregar despesas.");
        }

        const json = await response.json();
        const { items, page, totalPages } = normalizeExpenseResponse(
          json,
          mergedFilters.pageSize || 10
        );

        setExpenses(items);
        setTotalPages(totalPages);
        setFilters((previous) => ({ ...previous, page }));
      } catch (error: any) {
        setErrorMessage(error?.message || "Erro ao buscar despesas.");
        setExpenses([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void load(); // primeira carga
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createExpense = useCallback(async (input: CreateInput) => {
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Erro ao criar despesa.");
    }
    const created: Expense = await response.json().then((j) => j.data ?? j);
    setExpenses((previous) => [created, ...previous]);
    return created;
  }, []);

  const updateExpense = useCallback(
    async (expenseId: string, input: UpdateInput) => {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Erro ao atualizar despesa.");
      }
      const updated: Expense = await response.json();
      setExpenses((previous) =>
        previous.map((expense) =>
          expense.id === expenseId ? updated : expense
        )
      );
      return updated;
    },
    []
  );

  const deleteExpense = useCallback(async (expenseId: string) => {
    const response = await fetch(`/api/expenses/${expenseId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Erro ao excluir despesa.");
    }
    setExpenses((previous) =>
      previous.filter((expense) => expense.id !== expenseId)
    );
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

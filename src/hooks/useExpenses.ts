"use client";

import { useEffect, useState } from "react";
import { useToast } from "./useToast";

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
  date: string; // ISO yyyy-mm-ddT...
  amount: number;
  description: string;
  km: number | null;
  fuelLiters: number | null;
  pricePerLiter: number | null;
  fuelType: "GASOLINA" | "ETANOL" | "DIESEL" | "GNV" | null;
  station: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: any;
  attachments?: Array<{
    id: string;
    url: string;
    contentType: string | null;
    size: number | null;
  }>;
};

export type ExpenseFilters = {
  vehicleId?: string;
  type?: Expense["type"];
  dateFrom?: string; // yyyy-mm-dd
  dateTo?: string; // yyyy-mm-dd
  page?: number;
  pageSize?: number;
};

export function useExpenses(initialFilters?: ExpenseFilters) {
  const { showToast } = useToast();
  const [filters, setFilters] = useState<ExpenseFilters>({
    page: 1,
    pageSize: 20,
    ...initialFilters,
  });
  const [data, setData] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function buildQueryString(params: Record<string, unknown>) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
    return query.toString();
  }

  async function loadExpenses(next?: Partial<ExpenseFilters>) {
    try {
      setIsLoading(true);
      const merged = { ...filters, ...(next || {}) };
      const qs = buildQueryString(merged);
      const response = await fetch(`/api/expenses?${qs}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json?.error || "Falha ao carregar despesas.");
      setData(json.data || []);
      setTotalCount(json.totalCount || 0);
      setTotalPages(json.totalPages || 1);
      setFilters({ ...merged });
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message);
      showToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createExpense(
    payload: Omit<Expense, "id" | "createdAt" | "updatedAt" | "userId">
  ) {
    const response = await fetch("/api/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json?.error || "Falha ao criar despesa.");
    await loadExpenses();
    return json.data as Expense;
  }

  async function updateExpense(id: string, payload: Partial<Expense>) {
    const response = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();
    if (!response.ok)
      throw new Error(json?.error || "Falha ao atualizar despesa.");
    await loadExpenses();
    return json.data as Expense;
  }

  async function deleteExpense(id: string) {
    const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok)
      throw new Error(json?.error || "Falha ao remover despesa.");
    await loadExpenses();
    return true;
  }

  return {
    expenses: data,
    isLoading,
    errorMessage,
    totalCount,
    totalPages,
    filters,
    setFilters,
    reload: loadExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}

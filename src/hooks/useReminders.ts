"use client";

import { useCallback, useEffect, useState } from "react";

export type ReminderComputed = {
  id: string;
  vehicleId: string | null;
  type: string;
  title: string;
  notes?: string | null;
  status: "OK" | "DUE_SOON" | "OVERDUE";
  message: string;
};

type Filters = { vehicleId?: string; onlyActive?: boolean };

type RemindersHook = {
  reminders: ReminderComputed[];
  isLoading: boolean;
  errorMessage: string | null;
  filters: Filters;
  reload: (f?: Partial<Filters>) => Promise<void>;
  createRule: (payload: any) => Promise<void>;
  updateRule: (id: string, payload: any) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  markDone: (
    id: string,
    currentOdometer?: number,
    doneAt?: string
  ) => Promise<void>;
  snoozeRule: (id: string, days: number) => Promise<void>;
};

/** Normaliza resposta da API para array de lembretes. */
function normalizeReminders(payload: unknown): ReminderComputed[] {
  if (Array.isArray(payload)) return payload as ReminderComputed[];
  if (payload && Array.isArray((payload as any).items))
    return (payload as any).items as ReminderComputed[];
  if (payload && Array.isArray((payload as any).data))
    return (payload as any).data as ReminderComputed[];
  if (payload && Array.isArray((payload as any).results))
    return (payload as any).results as ReminderComputed[];
  return [];
}

export function useReminders(initialFilters?: Filters): RemindersHook {
  const [reminders, setReminders] = useState<ReminderComputed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters ?? {});

  const reload = useCallback(
    async (partial?: Partial<Filters>) => {
      try {
        setIsLoading(true);
        const next = { ...filters, ...(partial ?? {}) };
        const queryString = new URLSearchParams();
        if (next.vehicleId) queryString.set("vehicleId", next.vehicleId);
        if (next.onlyActive) queryString.set("onlyActive", "1");

        const response = await fetch(
          `/api/reminders?${queryString.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Erro ao carregar lembretes.");

        const json = await response.json();
        setReminders(normalizeReminders(json));
        setFilters(next);
        setErrorMessage(null);
      } catch (error: any) {
        setErrorMessage(error?.message || "Falha ao carregar.");
        setReminders([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void reload();
  }, []); // primeira carga

  async function createRule(payload: any) {
    const response = await fetch("/api/reminders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Falha ao criar lembrete.");
    await reload();
  }

  async function updateRule(id: string, payload: any) {
    const response = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Falha ao atualizar lembrete.");
    await reload();
  }

  async function deleteRule(id: string) {
    const response = await fetch(`/api/reminders/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Falha ao remover lembrete.");
    await reload();
  }

  async function markDone(
    id: string,
    currentOdometer?: number,
    doneAt?: string
  ) {
    const response = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "markDone",
        currentOdometer:
          typeof currentOdometer === "number" && !Number.isNaN(currentOdometer)
            ? currentOdometer
            : undefined,
        doneAt,
      }),
    });
    if (!response.ok) throw new Error("Falha ao marcar como feito.");
    await reload();
  }

  async function snoozeRule(id: string, days: number) {
    const response = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "snooze", days }),
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      throw new Error((json as any)?.error || "Falha ao adiar lembrete.");
    }
    await reload();
  }

  return {
    reminders,
    isLoading,
    errorMessage,
    filters,
    reload,
    createRule,
    updateRule,
    deleteRule,
    markDone,
    snoozeRule,
  };
}

/** Contador para badge da sidebar */
export function useReminderCount(opts?: {
  vehicleId?: string;
  onlyActive?: boolean;
}) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const queryString = new URLSearchParams();
      if (opts?.vehicleId) queryString.set("vehicleId", opts.vehicleId);
      if (opts?.onlyActive ?? true) queryString.set("onlyActive", "1");
      const response = await fetch(
        `/api/reminders/count?${queryString.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );
      const json = await response.json();
      setCount(json.count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [opts?.vehicleId, opts?.onlyActive]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { count, loading, reload };
}

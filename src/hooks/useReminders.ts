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

export function useReminders(initialFilters?: {
  vehicleId?: string;
  onlyActive?: boolean;
}) {
  const [reminders, setReminders] = useState<ReminderComputed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    vehicleId?: string;
    onlyActive?: boolean;
  }>(initialFilters ?? {});

  const reload = useCallback(
    async (f?: Partial<typeof filters>) => {
      try {
        setIsLoading(true);
        const next = { ...filters, ...(f ?? {}) };
        const qs = new URLSearchParams();
        if (next.vehicleId) qs.set("vehicleId", next.vehicleId);
        if (next.onlyActive) qs.set("onlyActive", "1");
        const res = await fetch(`/api/reminders?${qs.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Erro ao carregar lembretes.");
        const data: ReminderComputed[] = await res.json();
        setReminders(data);
        setFilters(next);
        setErrorMessage(null);
      } catch (e: any) {
        setErrorMessage(e.message || "Falha ao carregar.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void reload();
  }, []); // load inicial

  async function createRule(payload: any) {
    const res = await fetch("/api/reminders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Falha ao criar lembrete.");
    await reload();
  }

  async function updateRule(id: string, payload: any) {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Falha ao atualizar lembrete.");
    await reload();
  }

  async function deleteRule(id: string) {
    const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Falha ao remover lembrete.");
    await reload();
  }

  async function markDone(
    id: string,
    currentOdometer?: number,
    doneAt?: string
  ) {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "markDone",
        currentOdometer:
          typeof currentOdometer === "number" && !Number.isNaN(currentOdometer)
            ? currentOdometer
            : undefined,
        doneAt,
      }),
    });
    if (!res.ok) throw new Error("Falha ao marcar como feito.");
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
  };
}

/** Hook só para contar lembretes em alerta (DUE_SOON/OVERDUE) */
export function useReminderCount(opts?: {
  vehicleId?: string;
  onlyActive?: boolean;
}) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (opts?.vehicleId) qs.set("vehicleId", opts.vehicleId);
      if (opts?.onlyActive ?? true) qs.set("onlyActive", "1");
      const res = await fetch(`/api/reminders/count?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
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

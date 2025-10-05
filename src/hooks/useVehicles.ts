"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Vehicle = {
  id: string;
  userId: string;
  nickname: string | null;
  plate: string | null;
  fuelDefault: "GASOLINA" | "ETANOL" | "DIESEL" | "GNV" | "FLEX" | null;
  odometerKm: number | null;
  createdAt: string; // vem ISO do API
  updatedAt: string;
};

type CreateInput = {
  nickname: string | null;
  plate: string | null;
  fuelDefault: Vehicle["fuelDefault"];
  odometerKm: number | null;
};

type UpdateInput = Partial<CreateInput>;

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/vehicles", {
        method: "GET",
        cache: "no-store", // <- sem cache
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Falha ao carregar veículos.");
      }
      const data: Vehicle[] = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErrorMessage(e?.message || "Erro ao buscar veículos.");
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // carrega ao montar
    void load();
  }, [load]);

  const createVehicle = useCallback(async (input: CreateInput) => {
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || "Erro ao criar veículo.");
    }
    const created: Vehicle = await res.json();
    // otimista: já injeta no topo
    setVehicles((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateVehicle = useCallback(async (id: string, input: UpdateInput) => {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || "Erro ao atualizar veículo.");
    }
    const updated: Vehicle = await res.json();
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    return updated;
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || "Erro ao excluir veículo.");
    }
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const helpers = useMemo(
    () => ({ reload: load, createVehicle, updateVehicle, deleteVehicle }),
    [load, createVehicle, updateVehicle, deleteVehicle]
  );

  return { vehicles, isLoading, errorMessage, ...helpers };
}

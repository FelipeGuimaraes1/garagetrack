"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Vehicle = {
  id: string;
  userId: string;
  nickname: string | null;
  plate: string | null;
  fuelDefault: "GASOLINA" | "ETANOL" | "DIESEL" | "GNV" | "FLEX" | null;
  odometerKm: number | null;
  createdAt: string; // ISO vindo da API
  updatedAt: string;
};

type CreateInput = {
  nickname: string | null;
  plate: string | null;
  fuelDefault: Vehicle["fuelDefault"];
  odometerKm: number | null;
};

type UpdateInput = Partial<CreateInput>;

/** Normaliza diferentes formatos de resposta para sempre obter um array de veículos. */
function normalizeVehicleList(payload: unknown): Vehicle[] {
  if (Array.isArray(payload)) return payload as Vehicle[];
  if (payload && Array.isArray((payload as any).items))
    return (payload as any).items as Vehicle[];
  if (payload && Array.isArray((payload as any).data))
    return (payload as any).data as Vehicle[];
  if (payload && Array.isArray((payload as any).results))
    return (payload as any).results as Vehicle[];
  return [];
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/vehicles", {
        method: "GET",
        cache: "no-store",
        credentials: "include", // garante envio de cookies/sessão
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Falha ao carregar veículos.");
      }
      const json = await response.json();
      setVehicles(normalizeVehicleList(json));
    } catch (error: any) {
      setErrorMessage(error?.message || "Erro ao buscar veículos.");
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(); // primeira carga
  }, [load]);

  const createVehicle = useCallback(async (input: CreateInput) => {
    const response = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Erro ao criar veículo.");
    }
    const created: Vehicle = await response.json();
    // UI otimista: injeta no topo
    setVehicles((previous) => [created, ...previous]);
    return created;
  }, []);

  const updateVehicle = useCallback(
    async (vehicleId: string, input: UpdateInput) => {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Erro ao atualizar veículo.");
      }
      const updated: Vehicle = await response.json();
      setVehicles((previous) =>
        previous.map((vehicle) =>
          vehicle.id === vehicleId ? updated : vehicle
        )
      );
      return updated;
    },
    []
  );

  const deleteVehicle = useCallback(async (vehicleId: string) => {
    const response = await fetch(`/api/vehicles/${vehicleId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Erro ao excluir veículo.");
    }
    setVehicles((previous) =>
      previous.filter((vehicle) => vehicle.id !== vehicleId)
    );
  }, []);

  const helpers = useMemo(
    () => ({ reload: load, createVehicle, updateVehicle, deleteVehicle }),
    [load, createVehicle, updateVehicle, deleteVehicle]
  );

  return { vehicles, isLoading, errorMessage, ...helpers };
}

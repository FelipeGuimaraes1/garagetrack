"use client";

import { useEffect, useState } from "react";
import { useToast } from "./useToast";

export type Vehicle = {
  id: string;
  userId: string;
  nickname: string | null;
  plate: string | null;
  odometerKm: number | null;
  fuelDefault: "GASOLINA" | "ETANOL" | "DIESEL" | "GNV" | "FLEX" | null;
  createdAt: string;
  updatedAt: string;
};

export function useVehicles() {
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadVehicles() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/vehicles", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json?.error || "Falha ao carregar veículos.");
      setVehicles(json.data ?? []);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.message);
      showToast(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createVehicle(payload: {
    nickname?: string | null;
    plate?: string | null;
    fuelDefault?: Vehicle["fuelDefault"];
    odometerKm?: number | null;
  }) {
    const response = await fetch("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json?.error || "Falha ao criar veículo.");
    await loadVehicles();
    return json.data as Vehicle;
  }

  async function updateVehicle(id: string, payload: Partial<Vehicle>) {
    const response = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();
    if (!response.ok)
      throw new Error(json?.error || "Falha ao atualizar veículo.");
    await loadVehicles();
    return json.data as Vehicle;
  }

  async function deleteVehicle(id: string) {
    const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok)
      throw new Error(json?.error || "Falha ao remover veículo.");
    await loadVehicles();
    return true;
  }

  return {
    vehicles,
    isLoading,
    errorMessage,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    reload: loadVehicles,
  };
}

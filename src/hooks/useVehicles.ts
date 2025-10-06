"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type Vehicle = {
  id: string;
  userId: string;
  nickname: string | null;
  plate: string | null;
  fuelDefault: "GASOLINA" | "ETANOL" | "DIESEL" | "GNV" | "FLEX" | null;
  odometerKm: number | null;
  createdAt: string;
  updatedAt: string;
};

/** Entrada para criação/edição (campos opcionais = undefined quando vazios) */
type CreateInput = {
  nickname?: string;
  plate?: string;
  fuelDefault?: Vehicle["fuelDefault"];
  odometerKm?: number;
};
type UpdateInput = Partial<CreateInput>;

/** Erro de validação estruturado (422) que a API devolve */
export type ValidationIssue = { path: string; message: string };
export type ValidationErrorPayload = {
  message: string;
  issues?: ValidationIssue[];
};

/** Normaliza respostas diferentes (array ou {data}) para um array de veículos */
function normalizeListResponse(payload: any): Vehicle[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/** Extrai JSON com segurança */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

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
        cache: "no-store",
      });
      const json = await safeJson(res);
      if (!res.ok) {
        throw new Error(json?.message || "Falha ao carregar veículos.");
      }
      setVehicles(normalizeListResponse(json));
    } catch (e: any) {
      setErrorMessage(e?.message || "Erro ao buscar veículos.");
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createVehicle = useCallback(async (input: CreateInput) => {
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const json = await safeJson(res);

    if (!res.ok) {
      // Propaga erro 422 com {message, issues[]} para os modais mostrarem por campo
      const err: any = new Error(json?.message || "Erro ao criar veículo.");
      err.status = res.status;
      err.payload = json;
      throw err;
    }

    const created: Vehicle = json?.data ?? json;
    setVehicles((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateVehicle = useCallback(async (id: string, input: UpdateInput) => {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const json = await safeJson(res);

    if (!res.ok) {
      const err: any = new Error(json?.message || "Erro ao atualizar veículo.");
      err.status = res.status;
      err.payload = json;
      throw err;
    }

    const updated: Vehicle = json?.data ?? json;
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    return updated;
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await safeJson(res);
    if (!res.ok) {
      throw new Error(json?.message || "Erro ao excluir veículo.");
    }
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const helpers = useMemo(
    () => ({ reload: load, createVehicle, updateVehicle, deleteVehicle }),
    [load, createVehicle, updateVehicle, deleteVehicle]
  );

  return { vehicles, isLoading, errorMessage, ...helpers };
}

"use client";

import { useVehicles } from "@/hooks/useVehicles";
import { formatDateISO } from "@/lib/utils/formatters";

export function VehicleList() {
  const { vehicles, isLoading, errorMessage } = useVehicles();

  if (isLoading) {
    return <div className="surface p-4">Carregando veículos...</div>;
  }

  if (errorMessage) {
    return (
      <div className="surface p-4 text-[var(--danger)]">{errorMessage}</div>
    );
  }

  if (!vehicles.length) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-[var(--muted)]">
          Você ainda não cadastrou veículos.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {vehicles.map((v) => (
        <li key={v.id} className="surface p-4 flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-base font-medium">
              {v.nickname || "Sem apelido"}
              {v.plate ? (
                <span className="ml-2 text-sm text-[var(--muted)]">
                  ({v.plate})
                </span>
              ) : null}
            </div>
            <div className="text-sm text-[var(--muted)]">
              {v.fuelDefault ? `Combustível: ${v.fuelDefault} · ` : ""}
              {v.odometerKm != null ? `Hodômetro: ${v.odometerKm} km · ` : ""}
              Criado: {formatDateISO(new Date(v.createdAt))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

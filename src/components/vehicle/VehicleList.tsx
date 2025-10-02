"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { emitAppEvent, onAppEvent } from "@/lib/utils/events";
import { formatDateISO } from "@/lib/utils/formatters";
import { Edit2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { VehicleEditModal } from "./VehicleEditModal";

export function VehicleList() {
  const { vehicles, isLoading, errorMessage, deleteVehicle, reload } =
    useVehicles();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<String | null>(null);
  const [removingId, setRemovingId] = useState<String | null>(null);

  useEffect(() => {
    const off = onAppEvent("gt:vehicles:changed", () => {
      void reload();
    });
    return off;
  }, [reload]);

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
    <>
      <ul className="grid gap-3">
        {vehicles.map((v) => (
          <li key={v.id} className="surface p-4">
            <div className="flex items-start justify-between gap-3">
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
                  {v.odometerKm != null
                    ? `Hodômetro: ${v.odometerKm} km · `
                    : ""}
                  Criado: {formatDateISO(new Date(v.createdAt))}
                </div>
              </div>

              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => setEditingId(v.id)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setRemovingId(v.id)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                >
                  <Trash2 size={16} className="text-[var(--danger)]" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <VehicleEditModal
        vehicleId={(editingId as string) ?? null}
        open={Boolean(editingId)}
        onClose={() => setEditingId(null)}
        onSaved={async () => {
          await reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(removingId)}
        title="Remover veículo"
        description="Esta ação não pode ser desfeita. Deseja realmente remover este veículo?"
        confirmText="Remover"
        onCancel={() => setRemovingId(null)}
        onConfirm={async () => {
          if (!removingId) return;
          try {
            await deleteVehicle(removingId as string);
            emitAppEvent("gt:vehicles:changed");
            showToast("Veículo removido!", "success");
          } catch (e: any) {
            showToast(e.message || "Falha ao remover veículo.", "error");
          } finally {
            setRemovingId(null);
          }
        }}
      />
    </>
  );
}

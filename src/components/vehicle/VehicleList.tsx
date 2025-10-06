"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { emitAppEvent, onAppEvent } from "@/lib/utils/events";
import { formatDateBR } from "@/lib/utils/formatters";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { VehicleCreateModal } from "./VehicleCreateModal";
import { VehicleEditModal } from "./VehicleEditModal";

export function VehicleList() {
  const { vehicles, isLoading, errorMessage, deleteVehicle, reload } =
    useVehicles();
  const { showToast } = useToast();

  // Use sempre "string" (minúsculo). "String" cria um wrapper object e pode causar bugs sutis.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    // Recarrega quando alguém emitir o evento "gt:vehicles:changed"
    const off = onAppEvent("gt:vehicles:changed", () => {
      void reload();
    });
    return off;
  }, [reload]);

  return (
    <>
      {/* Cabeçalho com botão "Novo veículo" */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Veículos</h1>

        <button
          onClick={() => setOpenCreate(true)}
          className="button-primary inline-flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} />
          Novo veículo
        </button>
      </div>

      {/* Estados da lista */}
      {isLoading ? (
        <div className="surface p-4">Carregando veículos...</div>
      ) : errorMessage ? (
        <div className="surface p-4 text-[var(--danger)]">{errorMessage}</div>
      ) : !vehicles.length ? (
        <div className="surface p-6 text-center">
          <p className="text-[var(--muted)]">
            Você ainda não cadastrou veículos.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {vehicles.map((vehicle) => (
            <li key={vehicle.id} className="surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-base font-medium">
                    {vehicle.nickname || "Sem apelido"}
                    {vehicle.plate ? (
                      <span className="ml-2 text-sm text-[var(--muted)]">
                        ({vehicle.plate})
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {vehicle.fuelDefault
                      ? `Combustível: ${vehicle.fuelDefault} · `
                      : ""}
                    {vehicle.odometerKm != null
                      ? `Hodômetro: ${vehicle.odometerKm} km · `
                      : ""}
                    Criado: {formatDateBR(vehicle.createdAt)}
                  </div>
                </div>

                <div className="shrink-0 flex gap-2">
                  <button
                    onClick={() => setEditingId(vehicle.id)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm cursor-pointer"
                    aria-label="Editar veículo"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setRemovingId(vehicle.id)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm cursor-pointer"
                    aria-label="Remover veículo"
                  >
                    <Trash2 size={16} className="text-[var(--danger)]" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal: criar */}
      <VehicleCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
      />

      {/* Modal: editar */}
      <VehicleEditModal
        vehicleId={editingId}
        open={Boolean(editingId)}
        onClose={() => setEditingId(null)}
        onSaved={async () => {
          await reload();
        }}
      />

      {/* Diálogo: remover */}
      <ConfirmDialog
        open={Boolean(removingId)}
        title="Remover veículo"
        description="Esta ação não pode ser desfeita. Deseja realmente remover este veículo?"
        confirmText="Remover"
        onCancel={() => setRemovingId(null)}
        onConfirm={async () => {
          if (!removingId) return;
          try {
            await deleteVehicle(removingId);
            emitAppEvent("gt:vehicles:changed");
            showToast("Veículo removido!", "success");
            await reload();
          } catch (error: any) {
            showToast(error?.message || "Falha ao remover veículo.", "error");
          } finally {
            setRemovingId(null);
          }
        }}
      />
    </>
  );
}

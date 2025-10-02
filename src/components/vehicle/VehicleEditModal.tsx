"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { emitAppEvent } from "@/lib/utils/events";
import { maskOdometer, maskPlate } from "@/lib/utils/mask-br";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  vehicleId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
};

const fuelOptions = ["GASOLINA", "ETANOL", "DIESEL", "GNV", "FLEX"] as const;

export function VehicleEditModal({ vehicleId, open, onClose, onSaved }: Props) {
  const { vehicles, updateVehicle } = useVehicles();
  const { showToast } = useToast();
  const current = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  );

  const [nickname, setNickname] = useState("");
  const [plate, setPlate] = useState("");
  const [fuelDefault, setFuelDefault] = useState<string>("");
  const [odometerKm, setOdometerKm] = useState("");

  // A11y
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(
    panelRef as unknown as React.RefObject<HTMLElement | null>,
    open
  );
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (current) {
      setNickname(current.nickname ?? "");
      setPlate(current.plate ?? "");
      setFuelDefault(current.fuelDefault ?? "");
      setOdometerKm(
        current.odometerKm != null ? String(current.odometerKm) : ""
      );
    }
  }, [current]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId) return;

    try {
      await updateVehicle(vehicleId, {
        nickname: nickname || null,
        plate: plate || null,
        fuelDefault: (fuelDefault || null) as any,
        odometerKm: odometerKm ? Number(odometerKm) : null,
      } as any);
      emitAppEvent("gt:vehicles:changed");
      showToast("Veículo atualizado com sucesso!", "success");
      if (onSaved) await onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar veículo.", "error");
    }
  }

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-edit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-md max-h-[85dvh] overflow-y-auto"
      >
        <div className="p-4 sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem]">
          <div className="flex items-center justify-between">
            <h2 id="vehicle-edit-title" className="text-lg font-semibold">
              Editar veículo
            </h2>
            <button
              onClick={onClose}
              className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
            >
              Fechar
            </button>
          </div>
        </div>

        <form className="space-y-3 p-4 pt-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1">Apelido</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Placa</label>
            <input
              value={plate}
              onChange={(e) => setPlate(maskPlate(e.target.value))}
              className="w-full px-3 py-2"
              maxLength={8}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Combustível padrão</label>
            <select
              value={fuelDefault}
              onChange={(e) => setFuelDefault(e.target.value)}
              className="w-full px-3 py-2"
            >
              <option value="">Selecione</option>
              {fuelOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Hodômetro (km)</label>
            <input
              value={odometerKm}
              onChange={(e) => setOdometerKm(maskOdometer(e.target.value))}
              inputMode="numeric"
              className="w-full px-3 py-2"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
            >
              Cancelar
            </button>
            <button type="submit" className="button-primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

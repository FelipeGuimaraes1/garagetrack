"use client";

import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { maskOdometer, maskPlate } from "@/lib/utils/mask-br";
import { useEffect, useMemo, useState } from "react";

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
      showToast("Veículo atualizado com sucesso!", "success");
      if (onSaved) await onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar veículo.", "error");
    }
  }

  if (!open || !current) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="panel w-full max-w-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Editar veículo</h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
          >
            Fechar
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1">Apelido</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Placa</label>
            <input
              value={plate}
              onChange={(e) => setPlate(maskPlate(e.target.value))}
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              maxLength={8}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Combustível padrão</label>
            <select
              value={fuelDefault}
              onChange={(e) => setFuelDefault(e.target.value)}
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
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
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
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

"use client";

import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import {
  maskCurrencyBRL,
  maskLiters2,
  maskPricePerLiter2,
  unmaskCurrencyBRL,
} from "@/lib/utils/mask-br";
import { useEffect, useMemo, useState } from "react";

type Props = {
  expenseId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
};

const types = [
  "ABASTECIMENTO",
  "MANUTENCAO",
  "IMPOSTO",
  "SEGURO",
  "MULTA",
  "OUTRO",
] as const;
const fuelTypes = ["GASOLINA", "ETANOL", "DIESEL", "GNV"] as const;

export function ExpenseEditModal({ expenseId, open, onClose, onSaved }: Props) {
  const { expenses, updateExpense } = useExpenses();
  const { vehicles } = useVehicles();
  const { showToast } = useToast();
  const current = useMemo(
    () => expenses.find((e) => e.id === expenseId),
    [expenses, expenseId]
  );

  // estados
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("ABASTECIMENTO");
  const [status, setStatus] = useState<"PAGO" | "PENDENTE">("PENDENTE");
  const [date, setDate] = useState<string>("");
  const [amountMasked, setAmountMasked] = useState("");
  const [description, setDescription] = useState("");
  const [km, setKm] = useState("");

  const [fuelLitersMasked, setFuelLitersMasked] = useState("");
  const [pricePerLiterMasked, setPricePerLiterMasked] = useState("");
  const [fuelType, setFuelType] = useState<string>("");
  const [station, setStation] = useState("");

  const isAbastecimento = useMemo(() => type === "ABASTECIMENTO", [type]);

  useEffect(() => {
    if (current) {
      setVehicleId(current.vehicleId);
      setType(current.type);
      setStatus(current.status);
      setDate(new Date(current.date).toISOString().slice(0, 10));
      setAmountMasked(maskCurrencyBRL(String(current.amount)));
      setDescription(current.description);
      setKm(current.km != null ? String(current.km) : "");
      setFuelLitersMasked(
        current.fuelLiters != null
          ? String(current.fuelLiters).replace(".", ",")
          : ""
      );
      setPricePerLiterMasked(
        current.pricePerLiter != null
          ? String(current.pricePerLiter).replace(".", ",")
          : ""
      );
      setFuelType(current.fuelType ?? "");
      setStation(current.station ?? "");
    }
  }, [current]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseId) return;

    try {
      const payload: any = {
        vehicleId,
        type,
        status,
        date,
        amount: unmaskCurrencyBRL(amountMasked),
        description,
        km: km ? Number(km) : null,
      };

      if (isAbastecimento) {
        payload.fuelLiters = fuelLitersMasked
          ? Number(fuelLitersMasked.replace(".", "").replace(",", "."))
          : null;
        payload.pricePerLiter = pricePerLiterMasked
          ? Number(pricePerLiterMasked.replace(".", "").replace(",", "."))
          : null;
        payload.fuelType = fuelType || null;
        payload.station = station || null;
      } else {
        payload.fuelLiters = null;
        payload.pricePerLiter = null;
        payload.fuelType = null;
        payload.station = null;
      }

      await updateExpense(expenseId, payload);
      showToast("Despesa atualizada com sucesso!", "success");
      if (onSaved) await onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar despesa.", "error");
    }
  }

  if (!open || !current) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="panel w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Editar despesa</h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
          >
            Fechar
          </button>
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1">Veículo</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nickname || v.plate || "Sem apelido"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              >
                <option value="PENDENTE">PENDENTE</option>
                <option value="PAGO">PAGO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Valor</label>
              <input
                inputMode="numeric"
                value={amountMasked}
                onChange={(e) =>
                  setAmountMasked(maskCurrencyBRL(e.target.value))
                }
                className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Descrição</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Hodômetro (km)</label>
            <input
              inputMode="numeric"
              value={km}
              onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
            />
          </div>

          {isAbastecimento && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Litros</label>
                <input
                  inputMode="numeric"
                  value={fuelLitersMasked}
                  onChange={(e) =>
                    setFuelLitersMasked(maskLiters2(e.target.value))
                  }
                  className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Preço/L</label>
                <input
                  inputMode="numeric"
                  value={pricePerLiterMasked}
                  onChange={(e) =>
                    setPricePerLiterMasked(maskPricePerLiter2(e.target.value))
                  }
                  className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Combustível</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
                >
                  <option value="">Selecione</option>
                  {fuelTypes.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Posto</label>
                <input
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full rounded-lg bg-transparent border border-[var(--border)] px-3 py-2"
                />
              </div>
            </div>
          )}

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

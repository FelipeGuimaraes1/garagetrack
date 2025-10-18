"use client";

import { useExpenses } from "@/hooks/useExpenses";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { emitAppEvent } from "@/lib/utils/events";
import {
  formatCurrencyBRL,
  maskCurrencyBRL,
  maskLiters2,
  maskPricePerLiter2,
  unmaskCurrencyBRL,
} from "@/lib/utils/mask-br";
import { useEffect, useMemo, useRef, useState } from "react";

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

function maskKmComma(v: string) {
  return v.replace(/[^\d,]/g, "");
}
function maskKmInt(v: string) {
  return v.replace(/\D/g, "");
}

export function ExpenseEditModal({ expenseId, open, onClose, onSaved }: Props) {
  const { expenses, updateExpense } = useExpenses();
  const { vehicles } = useVehicles();
  const { showToast } = useToast();

  const current = useMemo(
    () => expenses.find((e) => e.id === expenseId),
    [expenses, expenseId]
  );

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("ABASTECIMENTO");
  const [status, setStatus] = useState<"PAGO" | "PENDENTE">("PENDENTE");
  const [dateISO, setDateISO] = useState<string>("");
  const [amountMasked, setAmountMasked] = useState("");
  const [description, setDescription] = useState("");

  const [kmTrip, setKmTrip] = useState("");
  const [vehicleOdometerKm, setVehicleOdometerKm] = useState("");

  const [fuelLitersMasked, setFuelLitersMasked] = useState("");
  const [pricePerLiterMasked, setPricePerLiterMasked] = useState("");
  const [fuelType, setFuelType] = useState<string>("");
  const [station, setStation] = useState("");

  const isAbastecimento = useMemo(() => type === "ABASTECIMENTO", [type]);

  function loadFromCurrent() {
    if (!current) return;
    setVehicleId(current.vehicleId);
    setType(current.type as any);
    setStatus(current.status as any);
    setDateISO(new Date(current.date).toISOString().slice(0, 10));
    setAmountMasked(formatCurrencyBRL(current.amount));
    setDescription(current.description);
    setKmTrip(current.km != null ? String(current.km).replace(".", ",") : "");
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
    setVehicleOdometerKm("");
  }

  // carrega dados quando modal abre / troca de id
  useEffect(() => {
    if (open) loadFromCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expenseId, current]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseId) return;

    try {
      const kmNumber =
        kmTrip.trim() === ""
          ? undefined
          : Math.round(Number(kmTrip.replace(/\./g, "").replace(",", ".")));

      const payload: any = {
        vehicleId,
        type,
        status,
        dateISO,
        amount: String(unmaskCurrencyBRL(amountMasked)),
        description,
        km: typeof kmNumber === "number" ? String(kmNumber) : undefined,
        vehicleOdometerKm: vehicleOdometerKm
          ? String(Number(vehicleOdometerKm))
          : undefined,
      };

      if (isAbastecimento) {
        payload.fuelLiters = fuelLitersMasked
          ? String(
              Number(fuelLitersMasked.replace(/\./g, "").replace(",", "."))
            )
          : undefined;
        payload.pricePerLiter = pricePerLiterMasked
          ? String(
              Number(pricePerLiterMasked.replace(/\./g, "").replace(",", "."))
            )
          : undefined;
        payload.fuelType = fuelType || undefined;
        payload.station = station || undefined;
      }

      await updateExpense(expenseId, payload);
      emitAppEvent("gt:expenses:changed");
      showToast("Despesa atualizada com sucesso!", "success");
      if (onSaved) await onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar despesa.", "error");
    }
  }

  // A11y
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef as any, open);
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-edit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Painel flex + altura svh */}
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-lg h-[85svh] flex flex-col"
      >
        {/* Cabeçalho */}
        <div className="p-4 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem]">
          <div className="flex items-center justify-between">
            <h2 id="expense-edit-title" className="text-lg font-semibold">
              Editar despesa
            </h2>
            <button
              onClick={() => {
                loadFromCurrent();
                onClose();
              }}
              className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
            >
              Fechar
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Body rolável */}
          <div className="flex-1 overflow-y-auto touch-scroll p-4 pt-3 space-y-3">
            <div>
              <label className="block text-sm mb-1">Veículo</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2"
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
                  className="w-full px-3 py-2"
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
                  className="w-full px-3 py-2"
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
                  value={dateISO}
                  onChange={(e) => setDateISO(e.target.value)}
                  className="w-full px-3 py-2"
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
                  className="w-full px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Descrição</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Hodômetro (km)</label>
                <input
                  inputMode="numeric"
                  value={kmTrip}
                  onChange={(e) => setKmTrip(maskKmComma(e.target.value))}
                  className="w-full px-3 py-2"
                  placeholder="Ex.: 80010 ou 352,4"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">
                  Km total do veículo
                </label>
                <input
                  inputMode="numeric"
                  value={vehicleOdometerKm}
                  onChange={(e) =>
                    setVehicleOdometerKm(maskKmInt(e.target.value))
                  }
                  className="w-full px-3 py-2"
                  placeholder="Ex.: 105980"
                />
              </div>
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
                    className="w-full px-3 py-2"
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
                    className="w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Combustível</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2"
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
                    className="w-full px-3 py-2"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rodapé fixo */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] rounded-b-[1rem] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                loadFromCurrent(); // volta aos dados originais
                onClose();
              }}
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

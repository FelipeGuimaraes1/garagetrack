"use client";

import { useExpenses } from "@/hooks/useExpenses";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { emitAppEvent } from "@/lib/utils/events";
import { formatCurrencyBRL, unmaskCurrencyBRL } from "@/lib/utils/mask-br";
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

  // preenche ao carregar a despesa
  useEffect(() => {
    if (current) {
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
  }, [current]);

  // -------- RESET PADRÃO AO FECHAR --------
  function resetForm() {
    setVehicleId("");
    setType("ABASTECIMENTO");
    setStatus("PENDENTE");
    setDateISO("");
    setAmountMasked("");
    setDescription("");
    setKmTrip("");
    setVehicleOdometerKm("");
    setFuelLitersMasked("");
    setPricePerLiterMasked("");
    setFuelType("");
    setStation("");
  }
  function handleClose() {
    resetForm();
    onClose();
  }
  useEffect(() => {
    if (!open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
      handleClose();
    } catch (err: any) {
      showToast(err.message || "Erro ao atualizar despesa.", "error");
    }
  }

  // A11y
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(
    panelRef as unknown as React.RefObject<HTMLElement | null>,
    open
  );
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-edit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-lg max-h-[85dvh] overflow-y-auto"
      >
        <div className="p-4 sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem]">
          <div className="flex items-center justify-between">
            <h2 id="expense-edit-title" className="text-lg font-semibold">
              Editar despesa
            </h2>
            <button
              onClick={handleClose}
              className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
            >
              Fechar
            </button>
          </div>
        </div>

        <form className="grid gap-3 p-4 pt-3" onSubmit={handleSubmit}>
          {/* (seu formulário permanece igual) */}
          {/* ... */}

          <div className="pt-2 flex justify-end gap-2 sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] mt-2">
            <button
              type="button"
              onClick={handleClose}
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

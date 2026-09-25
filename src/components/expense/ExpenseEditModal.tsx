"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToast } from "@/hooks/useToast";
import type { Expense } from "@/hooks/useExpenses";
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

type UpdateExpense = (
  id: string,
  input: Record<string, unknown>
) => Promise<unknown>;

type Props = {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
  updateExpense: UpdateExpense;
};

type ValidationIssue = { path: string; message: string };

const types = [
  "ABASTECIMENTO",
  "MANUTENCAO",
  "IMPOSTO",
  "SEGURO",
  "MULTA",
  "OUTRO",
] as const;
const fuelTypes = ["GASOLINA", "ETANOL", "DIESEL", "GNV"] as const;

function maskKmComma(value: string) {
  return value.replace(/[^\d,]/g, "");
}

function maskKmInt(value: string) {
  return value.replace(/\D/g, "");
}

function dateOnly(value: Date | string): string {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function brToDecimalString(masked: string): string | undefined {
  const normalized = masked
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  if (!normalized || normalized === ".") return undefined;
  return normalized;
}

function commaKmToApi(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(",", ".");
  return normalized.endsWith(".") ? normalized.slice(0, -1) : normalized;
}

function mapIssues(issues: ValidationIssue[] | undefined) {
  const errors: Record<string, string> = {};
  let first: string | null = null;
  for (const issue of issues ?? []) {
    const key = issue.path || "general";
    if (!errors[key]) {
      errors[key] = issue.message;
      if (!first) first = key;
    }
  }
  return { errors, first };
}

function FieldError({ name, message }: { name: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`err-${name}`} className="mt-1 text-sm text-red-400">
      {message}
    </p>
  );
}

export function ExpenseEditModal({
  expense,
  open,
  onClose,
  onSaved,
  updateExpense,
}: Props) {
  const { vehicles } = useVehicles();
  const { showToast } = useToast();

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<Expense["type"]>("ABASTECIMENTO");
  const [status, setStatus] = useState<Expense["status"]>("PENDENTE");
  const [dateISO, setDateISO] = useState("");
  const [amountMasked, setAmountMasked] = useState("");
  const [description, setDescription] = useState("");
  const [kmTrip, setKmTrip] = useState("");
  const [vehicleOdometerKm, setVehicleOdometerKm] = useState("");
  const [fuelLitersMasked, setFuelLitersMasked] = useState("");
  const [pricePerLiterMasked, setPricePerLiterMasked] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [station, setStation] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isAbastecimento = useMemo(() => type === "ABASTECIMENTO", [type]);

  useEffect(() => {
    if (!expense) return;
    setVehicleId(expense.vehicleId);
    setType(expense.type);
    setStatus(expense.status);
    setDateISO(dateOnly(expense.date));
    setAmountMasked(formatCurrencyBRL(expense.amount));
    setDescription(expense.description);
    setKmTrip(expense.km != null ? String(expense.km).replace(".", ",") : "");
    setFuelLitersMasked(
      expense.fuelLiters != null
        ? String(expense.fuelLiters).replace(".", ",")
        : ""
    );
    setPricePerLiterMasked(
      expense.pricePerLiter != null
        ? String(expense.pricePerLiter).replace(".", ",")
        : ""
    );
    setFuelType(expense.fuelType ?? "");
    setStation(expense.station ?? "");
    setVehicleOdometerKm("");
    setFormErrors({});
  }, [expense]);

  function describedBy(name: string) {
    return formErrors[name] ? `err-${name}` : undefined;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!expense) return;

    setFormErrors({});
    setIsSaving(true);
    try {
      const currentVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
      const typedOdometer =
        vehicleOdometerKm.trim() === "" ? undefined : Number(vehicleOdometerKm);
      const shouldOmitOdometer =
        typedOdometer != null &&
        Number.isFinite(typedOdometer) &&
        currentVehicle?.odometerKm != null &&
        typedOdometer < currentVehicle.odometerKm;

      const payload: Record<string, unknown> = {
        vehicleId,
        type,
        status,
        dateISO,
        amount: brToDecimalString(amountMasked) ?? String(unmaskCurrencyBRL(amountMasked)),
        description,
        km: commaKmToApi(kmTrip) ?? null,
        vehicleOdometerKm: shouldOmitOdometer
          ? undefined
          : vehicleOdometerKm.trim() === ""
            ? undefined
            : vehicleOdometerKm.trim(),
      };

      if (isAbastecimento) {
        payload.fuelLiters = brToDecimalString(fuelLitersMasked);
        payload.pricePerLiter = brToDecimalString(pricePerLiterMasked);
        payload.fuelType = fuelType || undefined;
        payload.station = station.trim() ? station.trim() : null;
      }

      await updateExpense(expense.id, payload);
      emitAppEvent("gt:expenses:changed");
      showToast("Despesa atualizada com sucesso!", "success");
      if (onSaved) await onSaved();
      onClose();
    } catch (unknownError: unknown) {
      const error = unknownError as {
        message?: string;
        status?: number;
        payload?: { issues?: ValidationIssue[] };
      };
      if (error.status === 422) {
        const { errors, first } = mapIssues(error.payload?.issues);
        setFormErrors(errors);
        if (first && first !== "general") {
          document.getElementById(`edit-${first}`)?.focus();
        }
      } else {
        showToast(error.message || "Erro ao atualizar despesa.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef as unknown as React.RefObject<HTMLElement | null>, open);
  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose, isSaving]);

  if (!open || !expense) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid modal-overlay p-3 sm:p-4 items-start sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-edit-title"
      aria-busy={isSaving}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-lg h-[90svh] sm:h-auto sm:max-h-[85vh] flex flex-col"
      >
        <div className="p-4 shrink-0 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem]">
          <div className="flex items-center justify-between">
            <h2 id="expense-edit-title" className="text-lg font-semibold">
              Editar despesa
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
              disabled={isSaving}
            >
              Fechar
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 pt-3 pb-28"
          style={{
            WebkitOverflowScrolling: "touch",
            paddingBottom: `calc(7rem + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <form
            id="expense-edit"
            className="grid gap-3"
            onSubmit={handleSubmit}
            noValidate
          >
            {formErrors.general && (
              <p className="text-sm text-red-400">{formErrors.general}</p>
            )}

            <div>
              <label className="block text-sm mb-1" htmlFor="edit-vehicleId">
                Veículo
              </label>
              <select
                id="edit-vehicleId"
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
                className="w-full px-3 py-2"
                aria-invalid={Boolean(formErrors.vehicleId)}
                aria-describedby={describedBy("vehicleId")}
              >
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.nickname || vehicle.plate || "Sem apelido"}
                  </option>
                ))}
              </select>
              <FieldError name="vehicleId" message={formErrors.vehicleId} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" htmlFor="edit-type">
                  Tipo
                </label>
                <select
                  id="edit-type"
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as Expense["type"])
                  }
                  className="w-full px-3 py-2"
                  aria-invalid={Boolean(formErrors.type)}
                  aria-describedby={describedBy("type")}
                >
                  {types.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <FieldError name="type" message={formErrors.type} />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="edit-status">
                  Status
                </label>
                <select
                  id="edit-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as Expense["status"])
                  }
                  className="w-full px-3 py-2"
                  aria-invalid={Boolean(formErrors.status)}
                  aria-describedby={describedBy("status")}
                >
                  <option value="PENDENTE">PENDENTE</option>
                  <option value="PAGO">PAGO</option>
                </select>
                <FieldError name="status" message={formErrors.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" htmlFor="edit-dateISO">
                  Data
                </label>
                <input
                  id="edit-dateISO"
                  type="date"
                  value={dateISO}
                  onChange={(event) => setDateISO(event.target.value)}
                  className="w-full px-3 py-2"
                  aria-invalid={Boolean(formErrors.dateISO)}
                  aria-describedby={describedBy("dateISO")}
                />
                <FieldError name="dateISO" message={formErrors.dateISO} />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="edit-amount">
                  Valor
                </label>
                <input
                  id="edit-amount"
                  inputMode="numeric"
                  value={amountMasked}
                  onChange={(event) =>
                    setAmountMasked(maskCurrencyBRL(event.target.value))
                  }
                  className="w-full px-3 py-2"
                  aria-invalid={Boolean(formErrors.amount)}
                  aria-describedby={describedBy("amount")}
                />
                <FieldError name="amount" message={formErrors.amount} />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="edit-description">
                Descrição
              </label>
              <input
                id="edit-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full px-3 py-2"
                aria-invalid={Boolean(formErrors.description)}
                aria-describedby={describedBy("description")}
              />
              <FieldError name="description" message={formErrors.description} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" htmlFor="edit-km">
                  Hodômetro (km)
                </label>
                <input
                  id="edit-km"
                  inputMode="decimal"
                  value={kmTrip}
                  onChange={(event) => setKmTrip(maskKmComma(event.target.value))}
                  className="w-full px-3 py-2"
                  placeholder="Ex.: 80010 ou 352,4"
                  aria-invalid={Boolean(formErrors.km)}
                  aria-describedby={describedBy("km")}
                />
                <FieldError name="km" message={formErrors.km} />
              </div>
              <div>
                <label
                  className="block text-sm mb-1"
                  htmlFor="edit-vehicleOdometerKm"
                >
                  Km total do veículo
                </label>
                <input
                  id="edit-vehicleOdometerKm"
                  inputMode="numeric"
                  value={vehicleOdometerKm}
                  onChange={(event) =>
                    setVehicleOdometerKm(maskKmInt(event.target.value))
                  }
                  className="w-full px-3 py-2"
                  placeholder="Ex.: 105980"
                  aria-invalid={Boolean(formErrors.vehicleOdometerKm)}
                  aria-describedby={describedBy("vehicleOdometerKm")}
                />
                <FieldError
                  name="vehicleOdometerKm"
                  message={formErrors.vehicleOdometerKm}
                />
              </div>
            </div>

            {isAbastecimento && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" htmlFor="edit-fuelLiters">
                    Litros
                  </label>
                  <input
                    id="edit-fuelLiters"
                    inputMode="numeric"
                    value={fuelLitersMasked}
                    onChange={(event) =>
                      setFuelLitersMasked(maskLiters2(event.target.value))
                    }
                    className="w-full px-3 py-2"
                    aria-invalid={Boolean(formErrors.fuelLiters)}
                    aria-describedby={describedBy("fuelLiters")}
                  />
                  <FieldError
                    name="fuelLiters"
                    message={formErrors.fuelLiters}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm mb-1"
                    htmlFor="edit-pricePerLiter"
                  >
                    Preço/L
                  </label>
                  <input
                    id="edit-pricePerLiter"
                    inputMode="numeric"
                    value={pricePerLiterMasked}
                    onChange={(event) =>
                      setPricePerLiterMasked(maskPricePerLiter2(event.target.value))
                    }
                    className="w-full px-3 py-2"
                    aria-invalid={Boolean(formErrors.pricePerLiter)}
                    aria-describedby={describedBy("pricePerLiter")}
                  />
                  <FieldError
                    name="pricePerLiter"
                    message={formErrors.pricePerLiter}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="edit-fuelType">
                    Combustível
                  </label>
                  <select
                    id="edit-fuelType"
                    value={fuelType}
                    onChange={(event) => setFuelType(event.target.value)}
                    className="w-full px-3 py-2"
                    aria-invalid={Boolean(formErrors.fuelType)}
                    aria-describedby={describedBy("fuelType")}
                  >
                    <option value="">Selecione</option>
                    {fuelTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <FieldError name="fuelType" message={formErrors.fuelType} />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="edit-station">
                    Posto
                  </label>
                  <input
                    id="edit-station"
                    value={station}
                    onChange={(event) => setStation(event.target.value)}
                    className="w-full px-3 py-2"
                    aria-invalid={Boolean(formErrors.station)}
                    aria-describedby={describedBy("station")}
                  />
                  <FieldError name="station" message={formErrors.station} />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="shrink-0 bg-[var(--surface)] border-t border-[var(--border)] px-4 py-3 rounded-b-[1rem]">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="expense-edit"
              className="button-primary disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSaving}
              aria-busy={isSaving}
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      opacity="0.25"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                  Salvando…
                </span>
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

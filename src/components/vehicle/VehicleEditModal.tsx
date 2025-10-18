"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { emitAppEvent } from "@/lib/utils/events";
import { maskOdometer, maskPlate } from "@/lib/utils/mask-br";
import { useEffect, useMemo, useRef, useState } from "react";

type ValidationIssue = { path: string; message: string };
type ValidationErrorPayload = { message: string; issues?: ValidationIssue[] };

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
    () => vehicles.find((vehicle) => vehicle.id === vehicleId),
    [vehicles, vehicleId]
  );

  const [nickname, setNickname] = useState("");
  const [plate, setPlate] = useState("");
  const [fuelDefault, setFuelDefault] = useState<string>("");
  const [odometerKm, setOdometerKm] = useState("");

  // Erros por campo
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 🔒 Estado de envio: desabilita botões e mostra spinner
  const [submitting, setSubmitting] = useState(false);

  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const plateInputRef = useRef<HTMLInputElement>(null);
  const fuelDefaultSelectRef = useRef<HTMLSelectElement>(null);
  const odometerInputRef = useRef<HTMLInputElement>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(
    panelRef as unknown as React.RefObject<HTMLElement | null>,
    open
  );

  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setFormErrors({});
    if (current) {
      setNickname(current.nickname ?? "");
      setPlate(current.plate ?? "");
      setFuelDefault(current.fuelDefault ?? "");
      setOdometerKm(
        current.odometerKm != null ? String(current.odometerKm) : ""
      );
    }
  }, [current]);

  function mapIssuesToFormErrors(payload: ValidationErrorPayload): {
    errors: Record<string, string>;
    firstErrorKey: string | null;
  } {
    const mapped: Record<string, string> = {};
    let firstKey: string | null = null;
    if (Array.isArray(payload.issues)) {
      for (const issue of payload.issues) {
        const key = issue.path || "general";
        if (!mapped[key]) {
          mapped[key] = issue.message;
          if (!firstKey) firstKey = key;
        }
      }
    }
    return { errors: mapped, firstErrorKey: firstKey };
  }

  function focusFirstErrorField(firstErrorKey: string | null) {
    if (!firstErrorKey) return;
    const normalizedKey = firstErrorKey.toLowerCase();
    if (normalizedKey.includes("nickname"))
      return nicknameInputRef.current?.focus();
    if (normalizedKey.includes("plate")) return plateInputRef.current?.focus();
    if (normalizedKey.includes("fuel"))
      return fuelDefaultSelectRef.current?.focus();
    if (normalizedKey.includes("odometer"))
      return odometerInputRef.current?.focus();
    panelRef.current?.focus();
  }

  /** RESET quando fecha/cancela */
  function resetForm() {
    setNickname("");
    setPlate("");
    setFuelDefault("");
    setOdometerKm("");
    setFormErrors({});
    setSubmitting(false);
  }
  function handleClose() {
    resetForm();
    onClose();
  }
  useEffect(() => {
    if (!open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!vehicleId) return;

    setFormErrors({});
    setSubmitting(true); // ⏳ inicia loading
    try {
      await updateVehicle(vehicleId, {
        nickname: nickname.trim() || undefined,
        plate: plate.trim() || undefined,
        fuelDefault: (fuelDefault as any) || undefined,
        odometerKm: odometerKm ? Number(odometerKm) : undefined,
      });

      emitAppEvent("gt:vehicles:changed");
      showToast("Veículo atualizado com sucesso!", "success");
      if (onSaved) await onSaved();
      handleClose();
    } catch (unknownError: any) {
      const payload: ValidationErrorPayload | undefined = unknownError?.payload;
      if (unknownError?.status === 422 && payload?.issues) {
        const { errors, firstErrorKey } = mapIssuesToFormErrors(payload);
        setFormErrors(errors);
        focusFirstErrorField(firstErrorKey);
      } else {
        showToast(
          unknownError?.message || "Erro ao atualizar veículo.",
          "error"
        );
      }
    } finally {
      setSubmitting(false); // ✅ encerra loading
    }
  }

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-edit-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-md max-h-[85dvh] overflow-y-auto"
        tabIndex={-1}
      >
        <div className="p-4 sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem]">
          <div className="flex items-center justify-between">
            <h2 id="vehicle-edit-title" className="text-lg font-semibold">
              Editar veículo
            </h2>
            <button
              onClick={handleClose}
              className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
              disabled={submitting} // 🔒 evita fechar durante envio
            >
              Fechar
            </button>
          </div>
        </div>

        <form className="space-y-3 p-4 pt-3" onSubmit={handleSubmit} noValidate>
          {/* Apelido */}
          <div>
            <label className="block text-sm mb-1">Apelido</label>
            <input
              ref={nicknameInputRef}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="w-full px-3 py-2"
              aria-invalid={Boolean(formErrors.nickname)}
              aria-describedby={
                formErrors.nickname ? "error-nickname" : undefined
              }
            />
            {formErrors.nickname && (
              <p id="error-nickname" className="mt-1 text-sm text-red-400">
                {formErrors.nickname}
              </p>
            )}
          </div>

          {/* Placa */}
          <div>
            <label className="block text-sm mb-1">Placa</label>
            <input
              ref={plateInputRef}
              value={plate}
              onChange={(event) => setPlate(maskPlate(event.target.value))}
              className="w-full px-3 py-2"
              maxLength={8}
              placeholder="Ex.: ABC1D23 (Mercosul) ou ABC1234 (antiga)"
              aria-invalid={Boolean(formErrors.plate)}
              aria-describedby={formErrors.plate ? "error-plate" : undefined}
            />
            {formErrors.plate && (
              <p id="error-plate" className="mt-1 text-sm text-red-400">
                {formErrors.plate}
              </p>
            )}
          </div>

          {/* Combustível padrão */}
          <div>
            <label className="block text sm mb-1">Combustível padrão</label>
            <select
              ref={fuelDefaultSelectRef}
              value={fuelDefault}
              onChange={(event) => setFuelDefault(event.target.value)}
              className="w-full px-3 py-2"
              aria-invalid={Boolean(formErrors.fuelDefault)}
              aria-describedby={
                formErrors.fuelDefault ? "error-fuelDefault" : undefined
              }
            >
              <option value="">Selecione</option>
              {fuelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {formErrors.fuelDefault && (
              <p id="error-fuelDefault" className="mt-1 text-sm text-red-400">
                {formErrors.fuelDefault}
              </p>
            )}
          </div>

          {/* Hodômetro */}
          <div>
            <label className="block text-sm mb-1">Hodômetro (km)</label>
            <input
              ref={odometerInputRef}
              value={odometerKm}
              onChange={(event) =>
                setOdometerKm(maskOdometer(event.target.value))
              }
              inputMode="numeric"
              className="w-full px-3 py-2"
              aria-invalid={Boolean(formErrors.odometerKm)}
              aria-describedby={
                formErrors.odometerKm ? "error-odometerKm" : undefined
              }
            />
            {formErrors.odometerKm && (
              <p id="error-odometerKm" className="mt-1 text-sm text-red-400">
                {formErrors.odometerKm}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="pt-2 flex justify-end gap-2 sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
              disabled={submitting} // 🔒 evita ação durante envio
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
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
                  <span className="sr-only">Salvando…</span>
                </span>
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { emitAppEvent } from "@/lib/utils/events";
import { maskOdometer, maskPlate } from "@/lib/utils/mask-br";

/**
 * Tipagem básica do retorno de erro 422 da API.
 * Mantemos genérica para aceitar variações do hook useVehicles.
 */
type ValidationIssue = { path: string; message: string };
type ValidationErrorPayload = { message: string; issues?: ValidationIssue[] };

type Props = { open: boolean; onClose: () => void };
const fuelOptions = ["GASOLINA", "ETANOL", "DIESEL", "GNV", "FLEX"] as const;

export function VehicleCreateModal({ open, onClose }: Props) {
  const router = useRouter();
  const { createVehicle, reload } = useVehicles();
  const { showToast } = useToast();

  // Estados de formulário
  const [nickname, setNickname] = useState("");
  const [plate, setPlate] = useState("");
  const [fuelDefault, setFuelDefault] = useState<string>("");
  const [odometerKm, setOdometerKm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estados de erros por campo (para exibição sob cada input)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Referências para focar no primeiro campo com erro
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const plateInputRef = useRef<HTMLInputElement>(null);
  const fuelDefaultSelectRef = useRef<HTMLSelectElement>(null);
  const odometerInputRef = useRef<HTMLInputElement>(null);

  // Acessibilidade: focus trap e ESC para fechar
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);
  useEffect(() => {
    if (!open) return;
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [open, onClose]);

  /**
   * Mapeia payload de erro (422) para um dicionário { campo: mensagem }
   * e retorna a chave do primeiro campo com erro para focar.
   */
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

  /**
   * Foca o primeiro campo com erro conhecido.
   */
  function focusFirstErrorField(firstErrorKey: string | null) {
    if (!firstErrorKey) return;
    const normalizedKey = firstErrorKey.toLowerCase();

    if (normalizedKey.includes("nickname")) {
      nicknameInputRef.current?.focus();
      return;
    }
    if (normalizedKey.includes("plate")) {
      plateInputRef.current?.focus();
      return;
    }
    if (normalizedKey.includes("fuel")) {
      fuelDefaultSelectRef.current?.focus();
      return;
    }
    if (normalizedKey.includes("odometer")) {
      odometerInputRef.current?.focus();
      return;
    }

    // fallback: foca o título do modal
    panelRef.current?.focus();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormErrors({}); // limpa erros anteriores

    try {
      await createVehicle({
        nickname: nickname || null,
        plate: plate || null,
        fuelDefault: (fuelDefault || null) as any,
        odometerKm: odometerKm ? Number(odometerKm) : null,
      });

      // Dispara eventos locais que você já usa
      emitAppEvent("gt:vehicles:changed");
      await reload().catch(() => {});

      // Força o server component a refazer a busca no banco
      router.refresh();

      showToast("Veículo criado com sucesso!", "success");

      // Limpa formulário e fecha
      setNickname("");
      setPlate("");
      setFuelDefault("");
      setOdometerKm("");
      onClose();
    } catch (unknownError: any) {
      // Tenta extrair payload 422 estruturado
      const payload: ValidationErrorPayload | undefined =
        unknownError?.data || unknownError?.response?.data;

      if (payload?.issues && Array.isArray(payload.issues)) {
        const { errors, firstErrorKey } = mapIssuesToFormErrors(payload);
        setFormErrors(errors);
        showToast(
          payload.message || "Há erros de validação no formulário.",
          "error"
        );
        focusFirstErrorField(firstErrorKey);
      } else {
        // Mensagem genérica
        showToast(unknownError?.message || "Erro ao criar veículo.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-create-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-md max-h-[85dvh] overflow-y-auto"
        tabIndex={-1}
      >
        <div className="p-4 sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem]">
          <div className="flex items-center justify-between">
            <h2 id="vehicle-create-title" className="text-lg font-semibold">
              Novo veículo
            </h2>
            <button
              onClick={onClose}
              className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5 cursor-pointer"
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
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)] outline-none focus:ring-1 focus:ring-white/10"
              placeholder="Ex.: Gol 1.6"
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
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)] outline-none focus:ring-1 focus:ring-white/10"
              placeholder="Ex.: ABC1D23 (Mercosul) ou ABC1234 (antiga)"
              maxLength={8}
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
            <label className="block text-sm mb-1">Combustível padrão</label>
            <select
              ref={fuelDefaultSelectRef}
              value={fuelDefault}
              onChange={(event) => setFuelDefault(event.target.value)}
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)] outline-none focus:ring-1 focus:ring-white/10"
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
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)] outline-none focus:ring-1 focus:ring-white/10"
              placeholder="Ex.: 78500"
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
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="button-primary disabled:opacity-50"
            >
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

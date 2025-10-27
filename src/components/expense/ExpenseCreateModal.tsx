"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ReminderRuleForm } from "@/components/reminders/ReminderRuleForm";
import { useExpenses } from "@/hooks/useExpenses";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useReminders } from "@/hooks/useReminders";
import { useToast } from "@/hooks/useToast";
import { UploadedAttachment } from "@/hooks/useUpload";
import { useVehicles } from "@/hooks/useVehicles";
import { emitAppEvent } from "@/lib/utils/events";
import {
  maskCurrencyBRL,
  maskLiters2,
  maskPricePerLiter2,
  unmaskCurrencyBRL,
} from "@/lib/utils/mask-br";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReceiptUploader } from "./ReceiptUploader";

type Props = { open: boolean; onClose: () => void };

const types = [
  "ABASTECIMENTO",
  "MANUTENCAO",
  "IMPOSTO",
  "SEGURO",
  "MULTA",
  "OUTRO",
] as const;
const fuelTypes = ["GASOLINA", "ETANOL", "DIESEL", "GNV"] as const;

/** Km com vírgula para o Trip (permite 352,5) */
function maskKmComma(v: string) {
  return v.replace(/[^\d,]/g, "");
}
/** Km total do veículo: apenas dígitos inteiros */
function maskKmInt(v: string) {
  return v.replace(/\D/g, "");
}

/** Tipos de erro 422 */
type ValidationIssue = { path: string; message: string };
type ValidationPayload = { message: string; issues?: ValidationIssue[] };

/** YYYY-MM-DD com fuso LOCAL (evita UTC “pular” o dia) */
function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function ExpenseCreateModal({ open, onClose }: Props) {
  const router = useRouter();
  const { vehicles } = useVehicles();
  const { createExpense, reload } = useExpenses();
  const { showToast } = useToast();
  const reminders = useReminders();

  // form
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("ABASTECIMENTO");
  const [status, setStatus] = useState<"PAGO" | "PENDENTE">("PENDENTE");
  const [dateISO, setDateISO] = useState<string>(() => todayLocalISO()); // ⬅️ local
  const [amountMasked, setAmountMasked] = useState("");
  const [description, setDescription] = useState("");

  const [kmTrip, setKmTrip] = useState(""); // Trip (opcional)
  const [vehicleOdometerKm, setVehicleOdometerKm] = useState(""); // OBRIGATÓRIO

  const [fuelLitersMasked, setFuelLitersMasked] = useState("");
  const [pricePerLiterMasked, setPricePerLiterMasked] = useState("");
  const [fuelType, setFuelType] = useState<string>("");
  const [station, setStation] = useState("");

  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  // Erros por campo
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [askReminder, setAskReminder] = useState(false);
  const [openReminder, setOpenReminder] = useState(false);
  const [prefillReminder, setPrefillReminder] = useState<any | null>(null);

  // Avisos de lembretes por km detectados após salvar
  const [kmAlerts, setKmAlerts] = useState<
    {
      id: string;
      title: string;
      status: "DUE_SOON" | "OVERDUE";
      message: string;
    }[]
  >([]);
  const [openKmAlerts, setOpenKmAlerts] = useState(false);

  const isAbastecimento = useMemo(() => type === "ABASTECIMENTO", [type]);

  // 🔒 Estado de carregamento para desabilitar e mostrar spinner no botão
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (vehicles.length && !vehicleId) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  useEffect(() => {
    if (!isAbastecimento) return;
    const amount = unmaskCurrencyBRL(amountMasked);
    const liters = Number(
      fuelLitersMasked.replace(/\./g, "").replace(",", ".")
    );
    if (amount > 0 && liters > 0) {
      const fixed = (amount / liters).toFixed(2).replace(".", ",");
      setPricePerLiterMasked(fixed);
    }
  }, [amountMasked, fuelLitersMasked, isAbastecimento]);

  function mapIssues(payload?: ValidationPayload) {
    const out: Record<string, string> = {};
    let first: string | null = null;
    if (payload?.issues) {
      for (const i of payload.issues) {
        const k = i.path || "general";
        if (!out[k]) {
          out[k] = i.message;
          if (!first) first = k;
        }
      }
    }
    return { out, first };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setIsSaving(true); // ⏳ inicia loading

    try {
      // kmTrip (aceita vírgula -> inteiro)
      const kmNumber =
        kmTrip.trim() === ""
          ? undefined
          : Math.round(Number(kmTrip.replace(/\./g, "").replace(",", ".")));

      // Guard para não enviar vehicleOdometerKm menor que o atual do veículo
      const currentVehicle = vehicles.find((v) => v.id === vehicleId);
      const typedOdometer = vehicleOdometerKm
        ? Number(vehicleOdometerKm)
        : undefined;
      const shouldOmitOdometer =
        typedOdometer != null &&
        currentVehicle?.odometerKm != null &&
        typedOdometer < currentVehicle.odometerKm;

      const payload: any = {
        vehicleId,
        type,
        status,
        dateISO,
        amount: String(unmaskCurrencyBRL(amountMasked)),
        description,
        km: typeof kmNumber === "number" ? String(kmNumber) : undefined,
        vehicleOdometerKm: shouldOmitOdometer
          ? undefined
          : typedOdometer != null
          ? String(typedOdometer)
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

      if (attachments.length) {
        payload.attachments = attachments.map((a) => ({
          url: a.url,
          contentType: a.contentType,
          size: a.size,
        }));
      }

      const { alerts } = await createExpense(payload);
      emitAppEvent("gt:expenses:changed");
      showToast("Despesa criada com sucesso!", "success");

      await reload().catch(() => {});
      router.refresh();

      if (Array.isArray(alerts) && alerts.length > 0) {
        setKmAlerts(alerts);
        setOpenKmAlerts(true);
      } else if (type === "MANUTENCAO") {
        setPrefillReminder({
          vehicleId,
          type: "SERVICE",
          title: "Próxima manutenção",
          notes: "",
          lastDoneKm: vehicleOdometerKm ? Number(vehicleOdometerKm) : undefined,
          lastDoneAtISO: dateISO,
          warnKmLeft: 500,
          isActive: true,
        });
        setAskReminder(true);
      } else {
        onClose();
      }

      // reset
      setAmountMasked("");
      setDescription("");
      setKmTrip("");
      setVehicleOdometerKm("");
      setFuelLitersMasked("");
      setPricePerLiterMasked("");
      setFuelType("");
      setStation("");
      setAttachments([]);
    } catch (err: any) {
      const payload: ValidationPayload | undefined = err?.payload;
      if (err?.status === 422 && payload?.issues) {
        const { out } = mapIssues(payload);
        setFormErrors(out);
      } else {
        showToast(err?.message || "Erro ao criar despesa.", "error");
      }
    } finally {
      setIsSaving(false); // ✅ encerra loading (caso o modal permaneça aberto)
    }
  }

  const consumptionMessage = useMemo(() => {
    if (!isAbastecimento) return "";
    const liters = Number(
      fuelLitersMasked.replace(/\./g, "").replace(",", ".")
    );
    const kmNum =
      kmTrip.trim() === ""
        ? NaN
        : Number(kmTrip.replace(/\./g, "").replace(",", "."));
    if (!liters || !kmNum || Number.isNaN(kmNum)) return "";
    return `Consumo: ${(kmNum / liters).toFixed(2)} km/L`;
  }, [isAbastecimento, fuelLitersMasked, kmTrip]);

  // A11y
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef as any, open);
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 grid modal-overlay p-3 sm:p-4 items-start sm:place-items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-create-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          className="modal-panel w-full max-w-lg h-[90svh] sm:h-auto sm:max-h-[85vh] flex flex-col"
        >
          {/* Header (fixo) */}
          <div className="p-4 shrink-0 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem]">
            <div className="flex items-center justify-between">
              <h2 id="expense-create-title" className="text-lg font-semibold">
                Nova despesa
              </h2>
              <button
                onClick={onClose}
                className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
                disabled={isSaving} // 🔒 evita fechar durante o envio
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Conteúdo rolável */}
          <div
            className="flex-1 overflow-y-auto px-4 pt-3 pb-28"
            style={{
              WebkitOverflowScrolling: "touch",
              paddingBottom: `calc(7rem + env(safe-area-inset-bottom, 0px))`,
            }}
          >
            <form
              id="expense-create"
              onSubmit={handleSubmit}
              noValidate
              className="grid gap-3"
            >
              <div>
                <label className="block text-sm mb-1">Veículo</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2"
                  aria-invalid={!!formErrors.vehicleId}
                  aria-describedby={
                    formErrors.vehicleId ? "err-vehicleId" : undefined
                  }
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nickname || v.plate || "Sem apelido"}
                    </option>
                  ))}
                </select>
                {formErrors.vehicleId && (
                  <p id="err-vehicleId" className="mt-1 text-sm text-red-400">
                    {formErrors.vehicleId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2"
                    aria-invalid={!!formErrors.type}
                    aria-describedby={formErrors.type ? "err-type" : undefined}
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {formErrors.type && (
                    <p id="err-type" className="mt-1 text-sm text-red-400">
                      {formErrors.type}
                    </p>
                  )}
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
                    aria-invalid={!!formErrors.dateISO}
                    aria-describedby={
                      formErrors.dateISO ? "err-dateISO" : undefined
                    }
                  />
                  {formErrors.dateISO && (
                    <p id="err-dateISO" className="mt-1 text-sm text-red-400">
                      {formErrors.dateISO}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Valor</label>
                  <input
                    inputMode="numeric"
                    value={amountMasked}
                    onChange={(e) =>
                      setAmountMasked(maskCurrencyBRL(e.target.value))
                    }
                    placeholder="R$ 0,00"
                    className="w-full px-3 py-2"
                    aria-invalid={!!formErrors.amount}
                    aria-describedby={
                      formErrors.amount ? "err-amount" : undefined
                    }
                  />
                  {formErrors.amount && (
                    <p id="err-amount" className="mt-1 text-sm text-red-400">
                      {formErrors.amount}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Descrição</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex.: Troca de óleo"
                  className="w-full px-3 py-2"
                  aria-invalid={!!formErrors.description}
                  aria-describedby={
                    formErrors.description ? "err-description" : undefined
                  }
                />
                {formErrors.description && (
                  <p id="err-description" className="mt-1 text-sm text-red-400">
                    {formErrors.description}
                  </p>
                )}
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
                    aria-invalid={!!formErrors.vehicleOdometerKm}
                    aria-describedby={
                      formErrors.vehicleOdometerKm
                        ? "err-vehicleOdometerKm"
                        : undefined
                    }
                  />
                  {formErrors.vehicleOdometerKm && (
                    <p
                      id="err-vehicleOdometerKm"
                      className="mt-1 text-sm text-red-400"
                    >
                      {formErrors.vehicleOdometerKm}
                    </p>
                  )}
                </div>
              </div>

              {isAbastecimento && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Litros</label>
                      <input
                        inputMode="numeric"
                        value={fuelLitersMasked}
                        onChange={(e) =>
                          setFuelLitersMasked(maskLiters2(e.target.value))
                        }
                        placeholder="0,00"
                        className="w-full px-3 py-2"
                        aria-invalid={!!formErrors.fuelLiters}
                        aria-describedby={
                          formErrors.fuelLiters ? "err-fuelLiters" : undefined
                        }
                      />
                      {formErrors.fuelLiters && (
                        <p
                          id="err-fuelLiters"
                          className="mt-1 text-sm text-red-400"
                        >
                          {formErrors.fuelLiters}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Preço/L</label>
                      <input
                        inputMode="numeric"
                        value={pricePerLiterMasked}
                        onChange={(e) =>
                          setPricePerLiterMasked(
                            maskPricePerLiter2(e.target.value)
                          )
                        }
                        placeholder="0,00"
                        className="w-full px-3 py-2"
                        aria-invalid={!!formErrors.pricePerLiter}
                        aria-describedby={
                          formErrors.pricePerLiter
                            ? "err-pricePerLiter"
                            : undefined
                        }
                      />
                      {formErrors.pricePerLiter && (
                        <p
                          id="err-pricePerLiter"
                          className="mt-1 text-sm text-red-400"
                        >
                          {formErrors.pricePerLiter}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Combustível</label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full px-3 py-2"
                        aria-invalid={!!formErrors.fuelType}
                        aria-describedby={
                          formErrors.fuelType ? "err-fuelType" : undefined
                        }
                      >
                        <option value="">Selecione</option>
                        {fuelTypes.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      {formErrors.fuelType && (
                        <p
                          id="err-fuelType"
                          className="mt-1 text-sm text-red-400"
                        >
                          {formErrors.fuelType}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm mb-1">Posto</label>
                      <input
                        value={station}
                        onChange={(e) => setStation(e.target.value)}
                        placeholder="Ex.: Posto Centro"
                        className="w-full px-3 py-2"
                      />
                    </div>
                  </div>

                  {consumptionMessage && (
                    <div className="text-sm text-[var(--muted)] -mt-1">
                      {consumptionMessage}
                    </div>
                  )}
                </>
              )}

              <div className="grid gap-2">
                <ReceiptUploader
                  onAdd={(a) => setAttachments((prev) => [...prev, a])}
                />
                {attachments.length ? (
                  <div className="text-sm text-[var(--muted)]">
                    {attachments.length} anexo(s) pronto(s) para enviar.
                  </div>
                ) : null}
              </div>
            </form>
          </div>

          {/* Footer (fixo) */}
          <div className="shrink-0 bg-[var(--surface)] border-t border-[var(--border)] px-4 py-3 rounded-b-[1rem]">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
                disabled={isSaving} // 🔒 evita ação durante o envio
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="expense-create"
                className="button-primary disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSaving} // 🔒 desabilita clique duplo
                aria-busy={isSaving}
              >
                {isSaving ? (
                  // ⏳ spinner acessível
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
          </div>
        </div>
      </div>

      {/* Pergunta lembrete (apenas após MANUTENCAO, se não houver alertas) */}
      <ConfirmDialog
        open={askReminder}
        title="Adicionar lembrete?"
        description="Deseja criar um lembrete para a próxima manutenção deste veículo?"
        confirmText="Sim, criar"
        cancelText="Agora não"
        onCancel={() => {
          setAskReminder(false);
          onClose();
        }}
        onConfirm={() => {
          setAskReminder(false);
          setOpenReminder(true);
        }}
      />

      {/* Avisos de manutenções por KM vencidas/chegando */}
      <ConfirmDialog
        open={openKmAlerts}
        title="Atenção com as manutenções"
        description={
          kmAlerts.length === 1
            ? `Há 1 manutenção por km ${
                kmAlerts[0].status === "OVERDUE" ? "vencida" : "chegando"
              }: "${kmAlerts[0].title}" (${kmAlerts[0].message}).`
            : `Foram detectadas ${kmAlerts.length} manutenções por km (entre vencidas e chegando). Você pode conferir na aba de Lembretes.`
        }
        confirmText="Ver lembretes"
        cancelText="Ok"
        onCancel={() => {
          setOpenKmAlerts(false);
          onClose();
        }}
        onConfirm={() => {
          setOpenKmAlerts(false);
          router.push("/reminders");
        }}
      />

      <ReminderRuleForm
        open={openReminder}
        onClose={() => {
          setOpenReminder(false);
          onClose();
        }}
        defaultValues={prefillReminder ?? undefined}
        onSubmit={async (payload) => {
          try {
            await reminders.createRule(payload);
            showToast("Lembrete criado com sucesso!", "success");
            await reminders.reload().catch(() => {});
            setOpenReminder(false);
            onClose();
          } catch (e: any) {
            showToast(e?.message || "Falha ao criar lembrete.", "error");
          }
        }}
      />
    </>
  );
}

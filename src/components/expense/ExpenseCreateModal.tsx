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
import { unmaskCurrencyBRL } from "@/lib/utils/mask-br";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [dateISO, setDateISO] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
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

  // coloca o primeiro veículo por padrão quando abrir
  useEffect(() => {
    if (vehicles.length && !vehicleId) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  // calcula preço/L se abastecimento
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

  // -------- RESET PADRÃO --------
  function resetForm() {
    setVehicleId(vehicles[0]?.id ?? "");
    setType("ABASTECIMENTO");
    setStatus("PENDENTE");
    setDateISO(new Date().toISOString().slice(0, 10));
    setAmountMasked("");
    setDescription("");
    setKmTrip("");
    setVehicleOdometerKm("");
    setFuelLitersMasked("");
    setPricePerLiterMasked("");
    setFuelType("");
    setStation("");
    setAttachments([]);
    setFormErrors({});
    setAskReminder(false);
    setOpenReminder(false);
    setPrefillReminder(null);
    setKmAlerts([]);
    setOpenKmAlerts(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  // se o modal for fechado por qualquer motivo externo, reseta
  useEffect(() => {
    if (!open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

    try {
      // kmTrip (aceita vírgula -> inteiro)
      const kmNumber =
        kmTrip.trim() === ""
          ? undefined
          : Math.round(Number(kmTrip.replace(/\./g, "").replace(",", ".")));

      const payload: any = {
        vehicleId,
        type,
        status,
        dateISO, // <— chave do schema
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
        handleClose();
      }

      // se ficou na tela (ex.: abrimos dialog), não some o que foi preenchido agora.
      // o reset geral acontece ao fechar pelo handleClose.
    } catch (err: any) {
      const payload: ValidationPayload | undefined = err?.payload;
      if (err?.status === 422 && payload?.issues) {
        const { out } = mapIssues(payload);
        setFormErrors(out);
      } else {
        showToast(err?.message || "Erro ao criar despesa.", "error");
      }
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
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-create-title"
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
              <h2 id="expense-create-title" className="text-lg font-semibold">
                Nova despesa
              </h2>
              <button
                onClick={handleClose}
                className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
              >
                Fechar
              </button>
            </div>
          </div>

          <form
            className="grid gap-3 p-4 pt-3"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* ... (todo o seu formulário inalterado) ... */}

            {/* Veículo */}
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

            {/* (demais campos permanecem exatamente como você enviou) */}

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

      {/* dialogs (inalterados, mas trocamos onClose -> handleClose onde fecha o modal principal) */}
      <ConfirmDialog
        open={askReminder}
        title="Adicionar lembrete?"
        description="Deseja criar um lembrete para a próxima manutenção deste veículo?"
        confirmText="Sim, criar"
        cancelText="Agora não"
        onCancel={() => {
          setAskReminder(false);
          handleClose();
        }}
        onConfirm={() => {
          setAskReminder(false);
          setOpenReminder(true);
        }}
      />

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
          handleClose();
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
          handleClose();
        }}
        defaultValues={prefillReminder ?? undefined}
        onSubmit={async (payload) => {
          try {
            await reminders.createRule(payload);
            showToast("Lembrete criado com sucesso!", "success");
            await reminders.reload().catch(() => {});
            setOpenReminder(false);
            handleClose();
          } catch (e: any) {
            showToast(e?.message || "Falha ao criar lembrete.", "error");
          }
        }}
      />
    </>
  );
}

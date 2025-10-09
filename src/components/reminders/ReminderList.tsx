"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useReminders } from "@/hooks/useReminders";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { useMemo, useState } from "react";
import { MarkDoneDialog } from "./MarkDoneDialog";
import { ReminderRuleForm } from "./ReminderRuleForm";
import { SnoozeDialog } from "./SnoozeDialog";

/**
 * Forma mínima que o item de lembrete precisa ter para renderização.
 * Isso permite o componente lidar com pequenas variações do hook.
 */
type ReminderLike = {
  id: string;
  vehicleId: string | null;
  title: string;
  type: string;
  status?: string;
  message?: string;

  // campos extras que a API já retorna e que usamos para “feito hoje”
  lastDoneAt?: string | null;
  lastDoneKm?: number | null;
  everyKm?: number | null;
  everyDays?: number | null;
  dueDate?: string | null;
  warnKmLeft?: number | null;
  warnDaysLeft?: number | null;
  notes?: string | null;
};

function isISODateToday(iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  return d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
}

export function ReminderList() {
  const {
    reminders,
    isLoading,
    errorMessage,
    reload,
    createRule,
    updateRule,
    deleteRule,
    markDone,
    snoozeRule,
  } = useReminders({ onlyActive: true });

  const { vehicles } = useVehicles();
  const { showToast } = useToast();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [markId, setMarkId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);

  // novo: visualizar
  const [viewing, setViewing] = useState<ReminderLike | null>(null);

  /**
   * Normaliza o retorno do hook para um array:
   * - Se já for array, usa diretamente.
   * - Se vier como objeto paginado, tenta usar a propriedade "data".
   * - Caso contrário, cai para array vazio para evitar crash.
   */
  const remindersList: ReminderLike[] = useMemo(() => {
    if (Array.isArray(reminders)) return reminders as ReminderLike[];
    if (reminders && Array.isArray((reminders as any).data)) {
      return (reminders as any).data as ReminderLike[];
    }
    return [];
  }, [reminders]);

  function colorByStatus(status: string | undefined) {
    if (status === "OVERDUE") return "border-[color:var(--danger)]/40";
    if (status === "DUE_SOON") return "border-[color:var(--warning)]/40";
    return "border-[var(--border)]";
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lembretes</h2>
        <button
          className="button-primary"
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          Novo lembrete
        </button>
      </div>

      {isLoading && <div className="surface p-4">Carregando...</div>}
      {errorMessage && (
        <div className="surface p-4 text-[var(--danger)]">{errorMessage}</div>
      )}

      {/* Lista segura — sempre mapeia sobre array normalizado */}
      <ul className="grid gap-3">
        {remindersList.map((reminder) => {
          const vehicle = vehicles.find(
            (vehicleItem) => vehicleItem.id === reminder.vehicleId
          );
          const doneToday = isISODateToday(reminder.lastDoneAt);

          return (
            <li
              key={reminder.id}
              className={`surface p-4 border ${colorByStatus(reminder.status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <span>{reminder.title}</span>
                    {vehicle ? (
                      <span className="text-sm text-[var(--muted)]">
                        · {vehicle.nickname || vehicle.plate}
                      </span>
                    ) : null}
                    {doneToday && (
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full
                                   bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                        title="Marcado como feito hoje"
                      >
                        <span aria-hidden>✅</span> Feito hoje
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    {reminder.type}
                    {reminder.message ? ` · ${reminder.message}` : ""}
                  </div>
                </div>

                <div className="shrink-0 flex gap-2">
                  {/* Visualizar */}
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={() => setViewing(reminder)}
                  >
                    Visualizar
                  </button>

                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setMarkId(reminder.id)}
                    disabled={doneToday}
                    title={
                      doneToday ? "Já foi marcado como feito hoje" : undefined
                    }
                  >
                    Feito
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setSnoozeId(reminder.id)}
                    disabled={doneToday}
                    title={
                      doneToday
                        ? "Lembrete já marcado como feito hoje"
                        : undefined
                    }
                  >
                    Adiar
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      setEditing(reminder);
                      setOpenForm(true);
                    }}
                    disabled={doneToday}
                    title={
                      doneToday
                        ? "Lembrete já marcado como feito hoje"
                        : undefined
                    }
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={() => setRemovingId(reminder.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <ReminderRuleForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        defaultValues={editing || undefined}
        onSubmit={async (payload) => {
          try {
            if (editing) {
              await updateRule(editing.id, payload);
              showToast("Lembrete atualizado!", "success");
            } else {
              await createRule(payload);
              showToast("Lembrete criado!", "success");
            }
            await reload();
            setOpenForm(false);
          } catch (error: any) {
            showToast(error?.message || "Falha ao salvar.", "error");
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(removingId)}
        title="Remover lembrete"
        description="Esta ação não pode ser desfeita. Deseja realmente remover?"
        confirmText="Remover"
        onCancel={() => setRemovingId(null)}
        onConfirm={async () => {
          if (!removingId) return;
          try {
            await deleteRule(removingId);
            showToast("Lembrete removido!", "success");
            await reload();
          } catch (error: any) {
            showToast(error?.message || "Falha ao remover.", "error");
          } finally {
            setRemovingId(null);
          }
        }}
      />

      <MarkDoneDialog
        open={Boolean(markId)}
        onClose={() => setMarkId(null)}
        onConfirm={async (odometerKm, doneAtISO) => {
          if (!markId) return;
          try {
            await markDone(markId, odometerKm, doneAtISO);
            showToast("Lembrete marcado como feito!", "success");
            await reload();
          } catch (error: any) {
            showToast(error?.message || "Falha ao marcar como feito.", "error");
          } finally {
            setMarkId(null);
          }
        }}
      />

      <SnoozeDialog
        open={Boolean(snoozeId)}
        onClose={() => setSnoozeId(null)}
        onConfirm={async (days) => {
          if (!snoozeId || !days) {
            setSnoozeId(null);
            return;
          }
          try {
            await snoozeRule!(snoozeId, days);
            showToast(`Lembrete adiado em ${days} dia(s).`, "info");
            await reload();
          } catch (error: any) {
            showToast(error?.message || "Falha ao adiar.", "error");
          } finally {
            setSnoozeId(null);
          }
        }}
      />

      {/* Modal de visualização */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewing(null);
          }}
        >
          <div className="modal-panel w-full max-w-md">
            <div className="p-4 border-b border-[var(--border)] rounded-t-[1rem] bg-[var(--surface)] flex items-center justify-between">
              <h2 className="text-lg font-semibold">Detalhes do lembrete</h2>
              <button
                onClick={() => setViewing(null)}
                className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
              >
                Fechar
              </button>
            </div>

            <div className="p-4 grid gap-2 text-sm">
              <div>
                <span className="text-[var(--muted)]">Título:</span>{" "}
                {viewing.title}
              </div>
              <div>
                <span className="text-[var(--muted)]">Tipo:</span>{" "}
                {viewing.type}
              </div>
              {viewing.message && (
                <div>
                  <span className="text-[var(--muted)]">Status:</span>{" "}
                  {viewing.status} · {viewing.message}
                </div>
              )}
              {viewing.notes && (
                <div>
                  <span className="text-[var(--muted)]">Observações:</span>{" "}
                  {viewing.notes}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[var(--muted)]">Cada X km:</span>{" "}
                  {viewing.everyKm ?? "—"}
                </div>
                <div>
                  <span className="text-[var(--muted)]">Cada X dias:</span>{" "}
                  {viewing.everyDays ?? "—"}
                </div>
                <div>
                  <span className="text-[var(--muted)]">
                    Avisar quando faltar (km):
                  </span>{" "}
                  {viewing.warnKmLeft ?? "—"}
                </div>
                <div>
                  <span className="text-[var(--muted)]">
                    Avisar quando faltar (dias):
                  </span>{" "}
                  {viewing.warnDaysLeft ?? "—"}
                </div>
                <div>
                  <span className="text-[var(--muted)]">Último feito em:</span>{" "}
                  {viewing.lastDoneAt
                    ? new Date(viewing.lastDoneAt).toLocaleDateString()
                    : "—"}
                </div>
                <div>
                  <span className="text-[var(--muted)]">Último km feito:</span>{" "}
                  {viewing.lastDoneKm ?? "—"}
                </div>
                <div className="col-span-2">
                  <span className="text-[var(--muted)]">Data limite:</span>{" "}
                  {viewing.dueDate
                    ? new Date(viewing.dueDate).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] rounded-b-[1rem] bg-[var(--surface)] flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

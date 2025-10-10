"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useReminders } from "@/hooks/useReminders";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { useMemo, useState } from "react";
import { MarkDoneDialog } from "./MarkDoneDialog";
import { ReminderRuleForm } from "./ReminderRuleForm";
import { ReminderViewDialog } from "./ReminderViewDialog";
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
  /** 🔧 alinhar com o union usado no ReminderViewDialog */
  status?: "OK" | "DUE_SOON" | "OVERDUE";
  message?: string;
  notes?: string | null;
  everyKm?: number | null;
  everyDays?: number | null;
  lastDoneKm?: number | null;
  lastDoneAt?: string | Date | null;
  dueDate?: string | Date | null;
  warnKmLeft?: number | null;
  warnDaysLeft?: number | null;
  isActive?: boolean;
};

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
  const [editing, setEditing] = useState<ReminderLike | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [markId, setMarkId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ReminderLike | null>(null);

  const remindersList: ReminderLike[] = useMemo(() => {
    if (Array.isArray(reminders)) return reminders as ReminderLike[];
    if (reminders && Array.isArray((reminders as any).data)) {
      return (reminders as any).data as ReminderLike[];
    }
    return [];
  }, [reminders]);

  function colorByStatus(status: ReminderLike["status"]) {
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

      <ul className="grid gap-3">
        {remindersList.map((reminder) => {
          const vehicle = vehicles.find((v) => v.id === reminder.vehicleId);
          return (
            <li
              key={reminder.id}
              className={`surface p-4 border ${colorByStatus(reminder.status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {reminder.title}
                    {vehicle ? (
                      <span className="text-sm text-[var(--muted)] ml-2">
                        · {vehicle.nickname || vehicle.plate}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    {reminder.type}
                    {reminder.message ? ` · ${reminder.message}` : ""}
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={() => setViewing(reminder)}
                  >
                    Visualizar
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={() => setMarkId(reminder.id)}
                  >
                    Feito
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={() => setSnoozeId(reminder.id)}
                  >
                    Adiar
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={() => {
                      setEditing(reminder);
                      setOpenForm(true);
                    }}
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

      <ReminderViewDialog
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        reminder={viewing ?? undefined}
        vehicleLabel={
          viewing
            ? (() => {
                const v = vehicles.find((vv) => vv.id === viewing.vehicleId);
                return v ? v.nickname || v.plate || "" : "";
              })()
            : ""
        }
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
    </div>
  );
}

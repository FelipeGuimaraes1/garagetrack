"use client";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useReminders } from "@/hooks/useReminders";
import { useToast } from "@/hooks/useToast";
import { useVehicles } from "@/hooks/useVehicles";
import { useState } from "react";
import { ReminderRuleForm } from "./ReminderRuleForm";

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
  } = useReminders({ onlyActive: true });
  const { vehicles } = useVehicles();
  const { showToast } = useToast();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function colorByStatus(s: string) {
    if (s === "OVERDUE") return "border-[color:var(--danger)]/40";
    if (s === "DUE_SOON") return "border-[color:var(--warning)]/40";
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
        {reminders.map((r) => {
          const v = vehicles.find((x) => x.id === r.vehicleId);
          return (
            <li
              key={r.id}
              className={`surface p-4 border ${colorByStatus(r.status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {r.title}
                    {v ? (
                      <span className="text-sm text-[var(--muted)] ml-2">
                        · {v.nickname || v.plate}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--muted)] mt-1">
                    {r.type} · {r.message}
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={async () => {
                      try {
                        await markDone(r.id);
                        showToast("Lembrete marcado como feito!", "success");
                      } catch (e: any) {
                        showToast(
                          e.message || "Falha ao marcar como feito.",
                          "error"
                        );
                      }
                    }}
                  >
                    Feito
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={() => {
                      setEditing(r);
                      setOpenForm(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5 text-sm"
                    onClick={() => setRemovingId(r.id)}
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
          } catch (e: any) {
            showToast(e.message || "Falha ao salvar.", "error");
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
          } catch (e: any) {
            showToast(e.message || "Falha ao remover.", "error");
          } finally {
            setRemovingId(null);
          }
        }}
      />
    </div>
  );
}

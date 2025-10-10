"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useEffect, useMemo, useRef } from "react";

type ReminderView = {
  id: string;
  vehicleId: string | null;
  title: string;
  type: "OIL_CHANGE" | "SERVICE" | "DOCUMENT" | "FINE" | "CUSTOM" | string;
  notes?: string | null;

  everyKm?: number | null;
  everyDays?: number | null;

  lastDoneKm?: number | null;
  lastDoneAt?: string | Date | null;

  dueDate?: string | Date | null;

  warnKmLeft?: number | null;
  warnDaysLeft?: number | null;

  isActive?: boolean;
  status?: "OK" | "DUE_SOON" | "OVERDUE";
  message?: string;
};

const TYPE_LABEL: Record<string, string> = {
  OIL_CHANGE: "Troca de óleo",
  SERVICE: "Manutenção / Revisão",
  DOCUMENT: "Documento",
  FINE: "Multa",
  CUSTOM: "Personalizado",
};

function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}
function fmtNumber(n?: number | null) {
  if (n == null) return "—";
  return String(n);
}

export function ReminderViewDialog({
  open,
  onClose,
  reminder,
  vehicleLabel = "",
}: {
  open: boolean;
  onClose: () => void;
  reminder?: ReminderView;
  vehicleLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef as any, open);

  // fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const typeLabel = useMemo(
    () => (reminder ? TYPE_LABEL[reminder.type] ?? reminder.type : ""),
    [reminder]
  );

  if (!open || !reminder) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        // 🔧 menor e com rolagem
        className="modal-panel w-full max-w-md max-h-[75dvh] overflow-y-auto"
      >
        <div className="p-4 sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] rounded-t-[1rem] flex items-center justify-between">
          <h2 className="text-lg font-semibold">Detalhes do lembrete</h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
          >
            Fechar
          </button>
        </div>

        {/* Conteúdo compacto; campos somente leitura */}
        <div className="p-4 grid gap-3">
          <div>
            <label className="block text-sm mb-1">Título</label>
            <input
              readOnly
              className="w-full px-3 py-2 surface rounded-lg"
              value={reminder.title}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={typeLabel}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Veículo</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={vehicleLabel || "—"}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Observações</label>
            <textarea
              readOnly
              rows={3}
              className="w-full px-3 py-2 surface rounded-lg resize-y"
              value={reminder.notes || ""}
              placeholder="—"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Cada X km</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={fmtNumber(reminder.everyKm)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Cada X dias</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={fmtNumber(reminder.everyDays)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Último hodômetro</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={fmtNumber(reminder.lastDoneKm)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Última data</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={fmtDate(reminder.lastDoneAt)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Data limite</label>
            <input
              readOnly
              className="w-full px-3 py-2 surface rounded-lg"
              value={fmtDate(reminder.dueDate)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Avisar faltando (km)</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={fmtNumber(reminder.warnKmLeft)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Avisar faltando (dias)
              </label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={fmtNumber(reminder.warnDaysLeft)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Ativo</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={reminder.isActive ? "Sim" : "Não"}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <input
                readOnly
                className="w-full px-3 py-2 surface rounded-lg"
                value={
                  reminder.status === "OVERDUE"
                    ? "Vencido"
                    : reminder.status === "DUE_SOON"
                    ? "Chegando"
                    : "OK"
                }
              />
            </div>
          </div>

          {reminder.message ? (
            <div className="text-sm text-[var(--muted)]">
              {reminder.message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useRef, useState } from "react";

export function MarkDoneDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (odometer?: number, doneAt?: string) => void | Promise<void>;
}) {
  const [odometer, setOdometer] = useState<string>("");
  const [doneAt, setDoneAt] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef as any, open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div ref={panelRef} className="modal-panel w-full max-w-sm">
        <div className="p-4 border-b border-[var(--border)] rounded-t-[1rem] bg-[var(--surface)] flex items-center justify-between">
          <h2 className="text-lg font-semibold">Marcar como feito</h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
          >
            Fechar
          </button>
        </div>

        <div className="p-4 grid gap-3">
          <div>
            <label className="block text-sm mb-1">Hodômetro atual (km)</label>
            <input
              inputMode="numeric"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ""))}
              placeholder="Opcional"
              className="w-full px-3 py-2"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Opcional, mas recomendado para regras baseadas em quilometragem.
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">Data</label>
            <input
              type="date"
              value={doneAt}
              onChange={(e) => setDoneAt(e.target.value)}
              className="w-full px-3 py-2"
            />
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2 rounded-b-[1rem] bg-[var(--surface)]">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onConfirm(odometer ? Number(odometer) : undefined, doneAt)
            }
            className="button-primary"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

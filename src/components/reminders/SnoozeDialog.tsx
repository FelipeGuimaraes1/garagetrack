"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useRef, useState } from "react";

export function SnoozeDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (days: number) => void | Promise<void>;
}) {
  const [days, setDays] = useState<string>("7");
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
          <h2 className="text-lg font-semibold">Adiar lembrete</h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
          >
            Fechar
          </button>
        </div>

        <div className="p-4 grid gap-2">
          <label className="block text-sm mb-1">Dias para adiar</label>
          <input
            inputMode="numeric"
            value={days}
            onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-2"
            placeholder="Ex.: 7"
          />
          <p className="text-xs text-[var(--muted)]">
            Para regras de data fixa: empurra a data limite. Para regras por
            dias: empurra a data de referência.
          </p>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2 rounded-b-[1rem] bg-[var(--surface)]">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(Number(days || "0"))}
            className="button-primary"
          >
            Adiar
          </button>
        </div>
      </div>
    </div>
  );
}

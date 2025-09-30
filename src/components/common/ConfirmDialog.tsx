"use client";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirmar ação",
  description = "Tem certeza que deseja prosseguir?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(
    panelRef as unknown as React.RefObject<HTMLElement | null>,
    open
  );

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center modal-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div ref={panelRef} className="modal-panel w-full max-w-md p-4">
        <h3 id="confirm-title" className="text-lg font-semibold">
          {title}
        </h3>
        <p className="text-sm text-[var(--muted)] mt-1">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
          >
            {cancelText}
          </button>
          <button onClick={() => void onConfirm()} className="button-primary">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

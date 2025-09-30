"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";
type ToastItem = { id: string; message: string; type: ToastType };

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function showToast(message: string, type: ToastType = "info") {
    const id = crypto.randomUUID();
    const toast: ToastItem = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    // Auto-remover após 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  function classesFor(t: ToastItem) {
    // tarja lateral + borda com leve variação por tipo
    const base =
      "pointer-events-auto rounded-2xl px-4 py-3 min-w-[260px] bg-[var(--panel)] border shadow-xl flex items-start gap-3";
    const color =
      t.type === "success"
        ? "border-[color:var(--success)]/30"
        : t.type === "error"
        ? "border-[color:var(--danger)]/30"
        : t.type === "warning"
        ? "border-[color:var(--warning)]/30"
        : "border-[color:var(--accent)]/25";
    return `${base} ${color}`;
  }

  function barStyleFor(t: ToastItem): React.CSSProperties {
    const color =
      t.type === "success"
        ? "var(--success)"
        : t.type === "error"
        ? "var(--danger)"
        : t.type === "warning"
        ? "var(--warning)"
        : "var(--accent)";
    return { background: color };
  }

  function iconFor(t: ToastItem) {
    if (t.type === "success") return "✅";
    if (t.type === "error") return "❌";
    if (t.type === "warning") return "⚠️";
    return "ℹ️";
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Container no topo/direita */}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={classesFor(t)}
            role="status"
            aria-live="polite"
          >
            {/* Tarja lateral colorida */}
            <div
              className="h-6 w-1 rounded-full mt-0.5"
              style={barStyleFor(t)}
            />

            {/* Ícone + texto */}
            <div className="text-sm leading-5">
              <span className="mr-1">{iconFor(t)}</span>
              <span className="align-middle">{t.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx)
    throw new Error("useToastContext deve ser usado dentro de <ToastProvider>");
  return ctx;
}

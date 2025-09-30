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
    // auto remove
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }

  const value = useMemo<ToastContextValue>(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* container de toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto panel px-4 py-3 min-w-[240px] shadow-lg border",
              t.type === "success"
                ? "border-emerald-400/30"
                : t.type === "error"
                ? "border-red-400/30"
                : t.type === "warning"
                ? "border-amber-400/30"
                : "border-white/10",
            ].join(" ")}
          >
            <div className="text-sm">
              {t.type === "success" && "✅ "}
              {t.type === "error" && "❌ "}
              {t.type === "warning" && "⚠️ "}
              {t.type === "info" && "ℹ️ "}
              {t.message}
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

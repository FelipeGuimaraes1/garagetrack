"use client";

import { useToast } from "@/hooks/useToast";
import { useEffect, useRef } from "react";

const KEY = "gt_reminders_last_check_at"; // sessão

export function ReminderWatcher() {
  const { showToast } = useToast();
  const timerRef = useRef<number | null>(null);

  async function check() {
    try {
      const res = await fetch("/api/reminders", { cache: "no-store" });
      if (!res.ok) return;
      const list: Array<{ status: string; title: string }> = await res.json();
      const alerts = list.filter(
        (r) => r.status === "DUE_SOON" || r.status === "OVERDUE"
      );

      if (alerts.length > 0) {
        const over = alerts.filter((a) => a.status === "OVERDUE").length;
        const soon = alerts.length - over;
        const text =
          over > 0
            ? `${over} lembrete(s) vencido(s) e ${soon} chegando.`
            : `${soon} lembrete(s) chegando.`;
        showToast(`Atenção: ${text}`, over > 0 ? "warning" : "info");
      }
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    // checa 1x ao abrir a sessão
    const last = Number(sessionStorage.getItem(KEY) || 0);
    const elapsed = Date.now() - last;
    if (elapsed > 1000 * 60 * 60 * 1) {
      // 1 hora pra primeira sessão; pode ajustar
      void check();
    }

    // agenda checagem a cada 6 horas
    timerRef.current = window.setInterval(() => {
      void check();
    }, 1000 * 60 * 60 * 6);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  return null;
}

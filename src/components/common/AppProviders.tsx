"use client";

import { ReminderWatcher } from "@/components/reminders/ReminderWatcher";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Provedores de contexto que precisam rodar no cliente */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        {/* precisa ficar dentro do ToastProvider, pois usa useToast() */}
        <ReminderWatcher />
      </ToastProvider>
    </SessionProvider>
  );
}

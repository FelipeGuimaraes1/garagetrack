"use client";

import { useReminderCount } from "@/hooks/useReminders";
import Link from "next/link";

/** Link para /reminders com badge de contagem (DUE_SOON + OVERDUE) */
export function RemindersNavItem() {
  const { count } = useReminderCount({ onlyActive: true });

  return (
    <Link
      href="/reminders"
      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-[var(--border)]"
    >
      <span>Lembretes</span>
      {count > 0 && (
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-semibold rounded-full bg-[var(--warning)]/20 border border-[var(--warning)]/30">
          {count}
        </span>
      )}
    </Link>
  );
}

// src/components/reminders/RemindersNavItem.tsx
"use client";

import { useReminderCount } from "@/hooks/useReminders";
import Link from "next/link";

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 22a2.5 2.5 0 0 1-2.45-2h4.9A2.5 2.5 0 0 1 12 22Zm8-6V11a8 8 0 1 0-16 0v5l-2 2v1h20v-1l-2-2Z"
      />
    </svg>
  );
}

/** Link para /reminders com badge de contagem (DUE_SOON + OVERDUE).
 *  Quando `collapsed` for true, mostra só o ícone centralizado e uma
 *  badge pequena no canto, sem texto “vazar” para fora da sidebar.
 */
export function RemindersNavItem({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const { count } = useReminderCount({ onlyActive: true });

  if (collapsed) {
    return (
      <Link
        href="/reminders"
        className="relative grid place-items-center rounded-xl h-10 hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-white/10"
        title="Lembretes"
      >
        <BellIcon className="w-5 h-5" />
        {count > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 text-[10px] leading-4 font-semibold rounded-full
                       bg-[var(--warning)]/20 border border-[var(--warning)]/40 text-[var(--text)] grid place-items-center"
          >
            {count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/reminders"
      className="relative flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-[var(--border)]"
    >
      <span className="flex items-center gap-2 min-w-0">
        <BellIcon className="w-5 h-5 shrink-0" />
        <span className="truncate">Lembretes</span>
      </span>

      {count > 0 && (
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-semibold rounded-full bg-[var(--warning)]/20 border border-[var(--warning)]/30">
          {count}
        </span>
      )}
    </Link>
  );
}

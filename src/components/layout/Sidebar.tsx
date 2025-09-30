"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

const STORAGE_KEY = "gt.sidebar.collapsed";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // restaura estado salvo
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setIsCollapsed(saved === "1");

    // carrega usuário (stub via /api/me)
    (async () => {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const json = await response.json();
        if (response.ok) setCurrentUser(json.data);
      } catch {
        // silencioso
      }
    })();
  }, []);

  function toggle() {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={[
        "h-dvh sticky top-0 border-r border-[var(--border)] bg-[var(--panel)]",
        "transition-[width] duration-200 ease-out",
        isCollapsed ? "w-[64px]" : "w-[240px]",
      ].join(" ")}
    >
      {/* header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-[var(--border)]">
        <Link href="/" className="font-semibold tracking-tight">
          {isCollapsed ? "GT" : "GarageTrack"}
        </Link>
        <button
          onClick={toggle}
          aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:ring-1 hover:ring-white/5"
        >
          {isCollapsed ? "»" : "«"}
        </button>
      </div>

      {/* nav */}
      <nav className="p-3 space-y-2">
        <Link
          href="/dashboard"
          className="block px-3 py-2 rounded-lg hover:ring-1 hover:ring-white/5 border border-transparent hover:border-[var(--border)]"
        >
          {isCollapsed ? "📊" : "Dashboard"}
        </Link>
        <Link
          href="/vehicles"
          className="block px-3 py-2 rounded-lg hover:ring-1 hover:ring-white/5 border border-transparent hover:border-[var(--border)]"
        >
          {isCollapsed ? "🚗" : "Veículos"}
        </Link>
        <Link
          href="/expenses"
          className="block px-3 py-2 rounded-lg hover:ring-1 hover:ring-white/5 border border-transparent hover:border-[var(--border)]"
        >
          {isCollapsed ? "💳" : "Despesas"}
        </Link>
        <Link
          href="/reminders"
          className="block px-3 py-2 rounded-lg hover:ring-1 hover:ring-white/5 border border-transparent hover:border-[var(--border)]"
        >
          {isCollapsed ? "🔔" : "Lembretes"}
        </Link>
      </nav>

      {/* footer com usuário logado */}
      <div className="absolute inset-x-0 bottom-0 p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center text-sm">
            {currentUser?.name?.[0]?.toUpperCase() ??
              currentUser?.email?.[0]?.toUpperCase() ??
              "?"}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {currentUser?.name ?? "Usuário Demo"}
              </div>
              <div className="text-xs text-[var(--muted)] truncate">
                {currentUser?.email ?? "demo@garagetrack.dev"}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

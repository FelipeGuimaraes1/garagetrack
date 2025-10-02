"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RemindersNavItem } from "../reminders/RemindersNavItem";
import UserBadgeClient from "./UserBadgeClient";

const STORAGE_KEY = "gt.sidebar.collapsed";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setIsCollapsed(saved === "1");
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
          className="block px-3 py-2 rounded-lg hover:ring-1 hover:ring-white/5 border border-transparent hover:border-[var(--border)] truncate"
          title="Dashboard"
        >
          {isCollapsed ? "📊" : "Dashboard"}
        </Link>
        <Link
          href="/vehicles"
          className="block px-3 py-2 rounded-lg hover:ring-1 hover:ring-white/5 border border-transparent hover:border-[var(--border)] truncate"
          title="Veículos"
        >
          {isCollapsed ? "🚗" : "Veículos"}
        </Link>
        <Link
          href="/expenses"
          className="block px-3 py-2 rounded-lg hover:ring-1 hover:ring-white/5 border border-transparent hover:border-[var(--border)] truncate"
          title="Despesas"
        >
          {isCollapsed ? "💳" : "Despesas"}
        </Link>

        <RemindersNavItem collapsed={isCollapsed} />
      </nav>

      {/* footer: usuário logado */}
      <div className="absolute inset-x-0 bottom-0 p-3 border-t border-[var(--border)]">
        <UserBadgeClient collapsed={isCollapsed} />
      </div>
    </aside>
  );
}

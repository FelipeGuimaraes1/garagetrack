"use client";

import { Menu } from "lucide-react";
import Link from "next/link";

export default function Topbar({
  className = "",
  onMenu,
}: {
  className?: string;
  onMenu?: () => void;
}) {
  return (
    <header
      className={[
        "sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/75",
        "px-3 py-2",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="p-2 rounded-lg border border-transparent hover:bg-white/5 hover:border-white/10"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <Link href="/dashboard" className="font-semibold">
          GarageTrack
        </Link>

        <div className="ml-auto text-xs text-[var(--muted)]">
          {/* espaço para ações rápidas futuramente */}
        </div>
      </div>
    </header>
  );
}

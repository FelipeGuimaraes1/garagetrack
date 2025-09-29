"use client";

import Link from "next/link";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      {/* Topbar */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-[var(--border)]">
        <div className="mx-auto max-w-screen-md px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            GarageTrack
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/vehicles"
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
            >
              Veículos
            </Link>
            <Link
              href="/expenses"
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:ring-1 hover:ring-white/5"
            >
              Despesas
            </Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-screen-md px-4 py-4">{children}</main>
    </div>
  );
}

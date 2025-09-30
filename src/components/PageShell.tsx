"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import Link from "next/link";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
        {/* layout de app: sidebar + conteúdo. no mobile, sidebar é full width no topo? não: mantemos como estático e conteúdo flui */}
        <div className="flex">
          {/* sidebar fixa no desktop */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* conteúdo ocupa todo o espaço */}
          <div className="flex-1 min-w-0">
            {/* topbar (permanece para navegação rápida em mobile) */}
            <header className="md:hidden sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-[var(--border)]">
              <div className="mx-auto px-4 h-14 flex items-center justify-between">
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

            {/* conteúdo principal full width */}
            <main className="mx-auto px-4 py-4 md:px-6 md:py-6">
              <div className="max-w-screen-lg mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

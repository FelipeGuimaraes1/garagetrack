"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Shell da aplicação:
 * - Mostra Sidebar e topbar mobile SOMENTE quando autenticado e rota não for pública.
 * - Em rotas públicas (/signin, /signup) ou sem sessão, renderiza apenas o <main>.
 * Obs.: ToastProvider e demais providers já estão em AppProviders (layout.tsx).
 */
export function PageShell({ children }: { children: ReactNode }) {
  const { status } = useSession(); // "authenticated" | "unauthenticated" | "loading"
  const pathname = usePathname();

  const isPublicRoute = pathname === "/signin" || pathname === "/signup";
  const showAppChrome = !isPublicRoute && status === "authenticated";

  // Layout SEM sidebar (páginas públicas ou usuário deslogado)
  if (!showAppChrome) {
    return (
      <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
        <main className="mx-auto px-4 py-4 md:px-6 md:py-6">
          <div className="max-w-screen-lg mx-auto">{children}</div>
        </main>
      </div>
    );
  }

  // Layout COM sidebar (usuário autenticado)
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <div className="flex">
        {/* sidebar fixa no desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* conteúdo ocupa todo o espaço */}
        <div className="flex-1 min-w-0">
          {/* topbar (apenas quando autenticado; some nas rotas públicas) */}
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

          {/* conteúdo principal */}
          <main className="mx-auto px-4 py-4 md:px-6 md:py-6">
            <div className="max-w-screen-lg mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

"use client";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] app-shell grid lg:grid-cols-[auto_1fr]">
      {/* Desktop: sidebar fixa à esquerda */}
      <div className="hidden lg:block">
        <Sidebar variant="desktop" />
      </div>

      {/* Área de conteúdo */}
      <div className="flex flex-col min-w-0">
        {/* Mobile: topbar fixa */}
        <Topbar className="lg:hidden" onMenu={() => setMobileOpen(true)} />

        <main className="p-4 pt-3 lg:pt-4 min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile: drawer da sidebar */}
      <Sidebar
        variant="mobile"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </div>
  );
}

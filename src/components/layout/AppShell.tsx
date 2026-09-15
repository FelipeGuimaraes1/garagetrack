"use client";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] app-shell grid lg:grid-cols-[auto_1fr]">
      <div className="hidden lg:block">
        <Sidebar variant="desktop" />
      </div>

      <div className="flex flex-col min-w-0">
        <Topbar className="lg:hidden" onMenu={() => setMobileOpen(true)} />
        <main className="p-4 pt-3 lg:pt-4 min-w-0 flex-1">{children}</main>
      </div>

      <Sidebar
        variant="mobile"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </div>
  );
}

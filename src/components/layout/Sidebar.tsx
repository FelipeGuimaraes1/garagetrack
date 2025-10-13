"use client";

import {
  Bell,
  Car,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  LogOut,
  Wallet,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getInitials(name?: string | null, email?: string | null) {
  const base = (name || email || "").trim();
  if (!base) return "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type SidebarProps =
  | { variant: "desktop"; open?: never; onClose?: never; className?: string }
  | {
      variant: "mobile";
      open: boolean;
      onClose: () => void;
      className?: string;
    };

export default function Sidebar(props: SidebarProps) {
  const { data } = useSession();
  const user = data?.user;
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (props.variant === "desktop") {
      const v = localStorage.getItem("gt_sidebar_collapsed");
      setCollapsed(v === "1");
    }
  }, [props.variant]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("gt_sidebar_collapsed", next ? "1" : "0");
  }

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: <Gauge size={18} /> },
    { href: "/vehicles", label: "Veículos", icon: <Car size={18} /> },
    { href: "/expenses", label: "Despesas", icon: <Wallet size={18} /> },
    { href: "/reminders", label: "Lembretes", icon: <Bell size={18} /> },
  ];

  const initials = getInitials(user?.name, user?.email || null);

  /** ====== VARIANTE MOBILE (drawer) ====== */
  if (props.variant === "mobile") {
    const { open, onClose } = props;
    return (
      <>
        {/* Backdrop */}
        <div
          className={cx(
            "fixed inset-0 z-50 bg-black/60 transition-opacity",
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
          aria-hidden={!open}
        />

        {/* Painel */}
        <aside
          className={cx(
            "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[320px] bg-[var(--surface)] border-r border-[var(--border)]",
            "transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
            props.className
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
            <Link href="/dashboard" className="font-semibold">
              GarageTrack
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="px-2 py-2 space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cx(
                    "flex items-center gap-3 rounded-lg px-3 py-2",
                    "hover:bg-white/5 border border-transparent hover:border-white/10",
                    active && "bg-white/5 border-white/10"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] p-3">
            <div className="flex items-center gap-3">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "Avatar"}
                  className="w-9 h-9 rounded-full object-cover aspect-square shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full grid place-items-center font-semibold bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-white/10">
                  {initials}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {user?.name || "Usuário"}
                </div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {user?.email}
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="p-2 rounded-lg border border-transparent hover:bg-white/5 hover:border-white/10 shrink-0"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  /** ====== VARIANTE DESKTOP (fixa) ====== */
  return (
    <aside
      className={cx(
        "sticky top-0 h-[100dvh] border-r border-[var(--border)] bg-[var(--surface)]",
        collapsed ? "w-[72px]" : "w-[240px]",
        "transition-[width] duration-200 overflow-hidden",
        (props as any)?.className
      )}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <Link href="/dashboard" className="font-semibold">
          {!collapsed ? "GarageTrack" : "GT"}
        </Link>
        <button
          onClick={toggle}
          className="p-1 rounded hover:bg-white/5 border border-transparent hover:border-white/10"
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>

      <nav className="px-2 py-1 space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                "hover:bg-white/5 border border-transparent hover:border-white/10",
                active && "bg-white/5 border-white/10"
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] p-3">
        <div
          className={cx(
            collapsed
              ? "grid place-items-center gap-2"
              : "flex items-center gap-3"
          )}
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Avatar"}
              className={cx(
                "rounded-full object-cover aspect-square shrink-0",
                collapsed ? "w-8 h-8" : "w-9 h-9"
              )}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={cx(
                "rounded-full grid place-items-center font-semibold aspect-square shrink-0",
                collapsed ? "w-8 h-8 text-sm" : "w-9 h-9",
                "bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-white/10"
              )}
            >
              {initials}
            </div>
          )}

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">
                {user?.name || "Usuário"}
              </div>
              <div className="truncate text-xs text-[var(--muted)]">
                {user?.email}
              </div>
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="p-2 rounded-lg border border-transparent hover:bg-white/5 hover:border-white/10 shrink-0"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

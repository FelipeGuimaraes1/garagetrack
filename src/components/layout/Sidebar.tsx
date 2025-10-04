// "use client";

// import {
//   Bell,
//   Car,
//   ChevronsLeft,
//   ChevronsRight,
//   Gauge,
//   LogOut,
//   Wallet,
// } from "lucide-react";
// import { signOut, useSession } from "next-auth/react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useEffect, useMemo, useState } from "react";

// function cx(...xs: Array<string | false | null | undefined>) {
//   return xs.filter(Boolean).join(" ");
// }

// function getInitials(name?: string | null, email?: string | null) {
//   const base = (name || email || "").trim();
//   if (!base) return "?";
//   const parts = base.split(/\s+/).filter(Boolean);
//   if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//   return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
// }

// const LS_KEY = "gt_sidebar_collapsed";

// export default function Sidebar() {
//   const { data } = useSession();
//   const user = data?.user;
//   const pathname = usePathname();

//   const [collapsed, setCollapsed] = useState(false);
//   // se a imagem quebrar, caímos para as iniciais
//   const [imgOk, setImgOk] = useState(true);

//   // carregar preferência inicial
//   useEffect(() => {
//     setCollapsed(localStorage.getItem(LS_KEY) === "1");
//   }, []);

//   // sincronizar com outras abas
//   useEffect(() => {
//     const onStorage = (e: StorageEvent) => {
//       if (e.key === LS_KEY) setCollapsed(e.newValue === "1");
//     };
//     window.addEventListener("storage", onStorage);
//     return () => window.removeEventListener("storage", onStorage);
//   }, []);

//   function toggle() {
//     const next = !collapsed;
//     setCollapsed(next);
//     localStorage.setItem(LS_KEY, next ? "1" : "0");
//   }

//   const nav = useMemo(
//     () => [
//       { href: "/dashboard", label: "Dashboard", icon: <Gauge size={18} /> },
//       { href: "/vehicles", label: "Veículos", icon: <Car size={18} /> },
//       { href: "/expenses", label: "Despesas", icon: <Wallet size={18} /> },
//       { href: "/reminders", label: "Lembretes", icon: <Bell size={18} /> },
//     ],
//     []
//   );

//   const initials = getInitials(user?.name, user?.email || null);
//   const displayName = user?.name || user?.email || "Usuário";

//   return (
//     <aside
//       className={cx(
//         "sticky top-0 h-svh border-r border-[var(--border)] bg-[var(--surface)]",
//         collapsed ? "w-[72px]" : "w-[240px]",
//         "transition-[width] duration-200"
//       )}
//       aria-label="Barra lateral de navegação"
//     >
//       {/* topo */}
//       <div className="flex items-center justify-between px-3 py-3">
//         <Link
//           href="/dashboard"
//           className="font-semibold tracking-tight select-none"
//           aria-label="Ir para o Dashboard"
//         >
//           {!collapsed ? "GarageTrack" : "GT"}
//         </Link>

//         <button
//           onClick={toggle}
//           className="p-1 rounded hover:bg-white/5 border border-transparent hover:border-white/10"
//           title={collapsed ? "Expandir" : "Recolher"}
//           aria-pressed={collapsed}
//           aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
//         >
//           {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
//         </button>
//       </div>

//       {/* nav */}
//       <nav className="px-2 py-1 space-y-1">
//         {nav.map((item) => {
//           const active =
//             pathname === item.href || pathname.startsWith(item.href + "/");
//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               title={collapsed ? item.label : undefined}
//               aria-current={active ? "page" : undefined}
//               className={cx(
//                 "flex items-center gap-3 rounded-lg px-3 py-2",
//                 "hover:bg-white/5 border border-transparent hover:border-white/10",
//                 active && "bg-white/5 border-white/10"
//               )}
//             >
//               {item.icon}
//               {!collapsed && <span>{item.label}</span>}
//             </Link>
//           );
//         })}
//       </nav>

//       {/* user footer */}
//       <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] p-3">
//         <div className="flex items-center gap-3">
//           {/* avatar com fallback para iniciais */}
//           {user?.image && imgOk ? (
//             <img
//               src={user.image}
//               alt={displayName}
//               className={cx(
//                 "rounded-full object-cover",
//                 collapsed ? "size-8" : "size-9"
//               )}
//               referrerPolicy="no-referrer"
//               onError={() => setImgOk(false)}
//             />
//           ) : (
//             <div
//               className={cx(
//                 "rounded-full grid place-items-center font-semibold select-none",
//                 collapsed ? "size-8 text-sm" : "size-9",
//                 "bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-white/10"
//               )}
//               aria-hidden={!collapsed ? undefined : true}
//               title={collapsed ? displayName : undefined}
//             >
//               {initials}
//             </div>
//           )}

//           {/* quando expandida, mostra nome + email */}
//           {!collapsed && (
//             <div className="min-w-0 flex-1">
//               <div className="truncate font-medium">{displayName}</div>
//               {user?.email && (
//                 <div className="truncate text-xs text-[var(--muted)]">
//                   {user.email}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* logout */}
//           <button
//             onClick={() => signOut({ callbackUrl: "/signin" })}
//             className="p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
//             title="Sair"
//             aria-label="Sair"
//           >
//             <LogOut size={18} />
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// }

"use client";

import {
  Bell,
  Car,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  LogOut,
  Wallet,
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

export default function Sidebar() {
  const { data } = useSession();
  const user = data?.user;
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const v = localStorage.getItem("gt_sidebar_collapsed");
    setCollapsed(v === "1");
  }, []);
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

  return (
    <aside
      className={cx(
        "sticky top-0 h-svh border-r border-[var(--border)] bg-[var(--surface)]",
        collapsed ? "w-[72px]" : "w-[240px]",
        "transition-[width] duration-200 overflow-hidden" // <- impede “vazamentos”
      )}
    >
      {/* topo */}
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

      {/* nav */}
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

      {/* user footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] p-3">
        {/* Quando colapsada, empilha verticalmente; quando aberta, usa linha */}
        <div
          className={cx(
            collapsed
              ? "grid place-items-center gap-2"
              : "flex items-center gap-3"
          )}
        >
          {/* avatar */}
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Avatar"}
              className={cx(
                "rounded-full object-cover aspect-square shrink-0", // <- círculo perfeito
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

          {/* botão sair: garante que não quebre layout e fique sempre dentro */}
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className={cx(
              "p-2 rounded-lg border border-transparent hover:bg-white/5 hover:border-white/10",
              "shrink-0" // <- não deixa o botão espremer
            )}
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

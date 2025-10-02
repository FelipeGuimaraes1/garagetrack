"use client";

import { signOut, useSession } from "next-auth/react";

export default function UserBadgeClient({ collapsed }: { collapsed: boolean }) {
  const { data } = useSession();
  const user = data?.user;

  const initial = (user?.name?.[0] || user?.email?.[0] || "?").toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center text-sm overflow-hidden">
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-8 w-8 object-cover rounded-full"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {user?.name || user?.email || "Usuário"}
          </div>
          <div className="text-xs text-[var(--muted)] truncate">
            {user?.email || ""}
          </div>
        </div>
      )}

      {!collapsed && (
        <button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="px-2 py-1 rounded-lg border border-[var(--border)] text-sm hover:bg-white/5"
        >
          Sair
        </button>
      )}
    </div>
  );
}

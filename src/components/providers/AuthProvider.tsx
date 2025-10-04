"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // sem props já funciona — o provider buscará /api/auth/session
  return <SessionProvider>{children}</SessionProvider>;
}

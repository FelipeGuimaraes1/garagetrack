// Termo: "stub" = implementação temporária simulada.
// Aqui buscamos (ou criamos) o usuário de demo do seed para autenticação básica de dev.

import { prisma } from "@/lib/db";

export async function getCurrentUserId(): Promise<string> {
  const demoEmail = "demo@garagetrack.dev";
  let user = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: demoEmail, name: "Usuário Demo" },
    });
  }
  return user.id;
}

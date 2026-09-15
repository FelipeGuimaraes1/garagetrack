import { prisma } from "@/lib/utils/db";
import { hashPassword } from "@/lib/utils/password";
import { clientIpFromHeaders, consumeRateLimit } from "@/lib/security/rate-limit";
import { PasswordSchema } from "@/lib/validations/password";
import { NextResponse } from "next/server";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido."),
  password: PasswordSchema,
});

export async function POST(req: Request) {
  const allowed = consumeRateLimit(
    `register:${clientIpFromHeaders(req.headers)}`,
    5,
    15 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message || "Dados de cadastro inválidos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "Não foi possível cadastrar com este e-mail." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name: name || null, email, passwordHash },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

import { prisma } from "@/lib/utils/db";
import { hashPassword } from "@/lib/utils/password";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-mail e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists)
    return NextResponse.json(
      { error: "E-mail já cadastrado." },
      { status: 409 }
    );

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name: name || null, email, passwordHash },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

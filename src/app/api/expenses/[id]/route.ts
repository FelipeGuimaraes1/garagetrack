import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const data = await req.json();

  const updated = await prisma.expense.update({
    where: { id, userId: (session.user as any).id },
    data,
  });

  return NextResponse.json(updated);
}

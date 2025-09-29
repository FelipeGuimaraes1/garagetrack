import { getCurrentUserId } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { expenseUpdateSchema } from "@/lib/validations/expense";
import { NextResponse } from "next/server";

type RouteParams = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    const json = await request.json();
    const parsed = expenseUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      },
    });

    if (updated.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Despesa não encontrada." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Não foi possível atualizar a despesa." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    });
    if (!expense) {
      return NextResponse.json(
        { error: "Despesa não encontrada." },
        { status: 404 }
      );
    }
    if (expense.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    await prisma.expense.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Não foi possível remover a despesa." },
      { status: 500 }
    );
  }
}

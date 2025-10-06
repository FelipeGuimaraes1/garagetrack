export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { buildValidationError } from "@/lib/validations/errors";
import { ExpenseCreateSchema } from "@/lib/validations/expense";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function parseDateOnlyToUTC(dateISO: string): Date {
  // "YYYY-MM-DD" -> Date em UTC (meia-noite)
  const [y, m, d] = dateISO.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageIndex = Number(searchParams.get("pageIndex") ?? "0");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");
    const vehicleId = searchParams.get("vehicleId") ?? undefined;

    const where = {
      userId: session.user.id,
      ...(vehicleId ? { vehicleId } : {}),
    };

    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip: pageIndex * pageSize,
        take: pageSize,
        include: { attachments: true },
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({ data: expenses, totalCount }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Erro ao listar despesas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    const validationResult = ExpenseCreateSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        buildValidationError(
          "Erro de validação ao criar despesa.",
          validationResult.error.issues
        ),
        { status: 422 }
      );
    }

    const {
      vehicleId,
      type,
      status,
      dateISO,
      amount,
      description,
      km,
      fuelLiters,
      pricePerLiter,
      fuelType,
      station,
      attachments,
    } = validationResult.data;

    const createdExpense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        vehicleId,
        type,
        status, // se vier undefined, Prisma usa default(PENDENTE)
        date: parseDateOnlyToUTC(dateISO),
        amount: new Prisma.Decimal(amount),
        description,
        km: typeof km !== "undefined" ? new Prisma.Decimal(km) : null,
        fuelLiters:
          typeof fuelLiters !== "undefined"
            ? new Prisma.Decimal(fuelLiters)
            : null,
        pricePerLiter:
          typeof pricePerLiter !== "undefined"
            ? new Prisma.Decimal(pricePerLiter)
            : null,
        fuelType: fuelType ?? null,
        station: station ?? null,
        attachments: attachments
          ? {
              createMany: {
                data: attachments.map((a) => ({
                  url: a.url,
                  contentType: a.contentType ?? null,
                  size: typeof a.size === "number" ? a.size : null,
                })),
              },
            }
          : undefined,
      },
      include: { attachments: true },
    });

    return NextResponse.json({ data: createdExpense }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Erro ao criar despesa." },
      { status: 500 }
    );
  }
}

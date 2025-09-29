import { getCurrentUserId } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import {
  expenseCreateSchema,
  expenseListQuerySchema,
} from "@/lib/validations/expense";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);

    const parsed = expenseListQuerySchema.safeParse({
      vehicleId: searchParams.get("vehicleId") || undefined,
      type: (searchParams.get("type") as any) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { vehicleId, type, dateFrom, dateTo, page, pageSize } = parsed.data;

    const where: any = { userId };
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const totalCount = await prisma.expense.count({ where });
    const data = await prisma.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { attachments: true, vehicle: true },
    });

    return NextResponse.json({
      data,
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Não foi possível listar as despesas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const json = await request.json();
    const parsed = expenseCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      vehicleId,
      type,
      status,
      date,
      amount,
      description,
      km,
      fuelLiters,
      pricePerLiter,
      fuelType,
      station,
    } = parsed.data;

    // Garantir que o veículo pertence ao usuário
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.userId !== userId) {
      return NextResponse.json({ error: "Veículo inválido." }, { status: 400 });
    }

    const created = await prisma.expense.create({
      data: {
        userId,
        vehicleId,
        type,
        status: status ?? "PENDENTE",
        date: new Date(date),
        amount,
        description,
        km: km ?? null,
        fuelLiters: fuelLiters ?? null,
        pricePerLiter: pricePerLiter ?? null,
        fuelType: fuelType ?? null,
        station: station ?? null,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Não foi possível criar a despesa." },
      { status: 500 }
    );
  }
}

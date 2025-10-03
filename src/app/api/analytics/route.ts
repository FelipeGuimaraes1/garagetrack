export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { ExpenseType, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type MonthAgg = { monthISO: string; total: number };

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const month =
    searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const vehicleId = searchParams.get("vehicleId") || undefined;
  const typeStr = searchParams.get("type") || undefined;

  // converte string -> enum do Prisma (se vier vazio, ignora)
  const typeEnum: ExpenseType | undefined = typeStr
    ? (typeStr as ExpenseType)
    : undefined;

  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  // Tipamos explicitamente como ExpenseWhereInput
  const whereBase: Prisma.ExpenseWhereInput = {
    userId,
    date: { gte: start, lt: end },
    ...(vehicleId ? { vehicleId } : {}),
    ...(typeEnum ? { type: typeEnum } : {}),
  };

  const [sumThis, countThis, sumPrev, byVehicleRows, lastMonthsRows] =
    await Promise.all([
      prisma.expense.aggregate({ _sum: { amount: true }, where: whereBase }),
      prisma.expense.count({ where: whereBase }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          date: { gte: new Date(y, m - 2, 1), lt: new Date(y, m - 1, 1) },
          ...(vehicleId ? { vehicleId } : {}),
          ...(typeEnum ? { type: typeEnum } : {}),
        },
      }),
      prisma.expense.groupBy({
        by: ["vehicleId"],
        _sum: { amount: true },
        where: whereBase,
      }),
      // últimos 6 meses
      (async () => {
        const arr: MonthAgg[] = [];
        for (let i = 5; i >= 0; i--) {
          const ms = new Date(y, m - 1 - i, 1);
          const me = new Date(y, m - i, 1);
          const sum = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: {
              userId,
              date: { gte: ms, lt: me },
              ...(vehicleId ? { vehicleId } : {}),
              ...(typeEnum ? { type: typeEnum } : {}),
            },
          });
          arr.push({
            monthISO: `${ms.getFullYear()}-${String(ms.getMonth() + 1).padStart(
              2,
              "0"
            )}`,
            total: Number(sum._sum?.amount ?? 0), // <- usa ?. e ??
          });
        }
        return arr;
      })(),
    ]);

  const byVehicle = await Promise.all(
    byVehicleRows.map(async (r) => {
      const v = await prisma.vehicle.findUnique({ where: { id: r.vehicleId } });
      return {
        vehicleId: r.vehicleId,
        label: v?.nickname || v?.plate || "Veículo",
        total: Number(r._sum?.amount ?? 0), // <- usa ?. e ??
      };
    })
  );

  return NextResponse.json(
    {
      monthISO: month,
      totalThisMonth: Number(sumThis._sum?.amount ?? 0), // <- usa ?. e ??
      totalPrevMonth: Number(sumPrev._sum?.amount ?? 0),
      avgTicketThisMonth: countThis
        ? Number(sumThis._sum?.amount ?? 0) / countThis
        : 0,
      countThisMonth: countThis,
      byVehicle,
      lastMonths: lastMonthsRows,
    },
    { status: 200 }
  );
}

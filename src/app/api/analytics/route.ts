import { endOfMonth, formatISO, startOfMonth, subMonths } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type SummaryResponse = {
  monthISO: string;
  totalThisMonth: number;
  totalPrevMonth: number;
  avgTicketThisMonth: number;
  countThisMonth: number;
  byVehicle: Array<{ vehicleId: string; label: string; total: number }>;
  lastMonths: Array<{ monthISO: string; total: number }>;
};

// Tipos auxiliares para o retorno do groupBy
type GroupedByVehicle = { vehicleId: string; _sum: { amount: number | null } };

/** GET /api/analytics?month=YYYY-MM (opcional) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // p.ex. "2025-09"
  const baseDate = monthParam
    ? new Date(`${monthParam}-01T00:00:00`)
    : new Date();

  const from = startOfMonth(baseDate);
  const to = endOfMonth(baseDate);

  const prevFrom = startOfMonth(subMonths(from, 1));
  const prevTo = endOfMonth(subMonths(from, 1));

  // Apenas despesas pagas
  const baseWhere = { status: "PAGO" as const };

  // Mês atual
  const [sumThis, countThis] = await Promise.all([
    prisma.expense.aggregate({
      where: { ...baseWhere, date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.expense.count({
      where: { ...baseWhere, date: { gte: from, lte: to } },
    }),
  ]);

  const totalThisMonth: number = Number(sumThis._sum.amount ?? 0);
  const countThisMonth: number = countThis;
  const avgTicketThisMonth: number = countThisMonth
    ? totalThisMonth / countThisMonth
    : 0;

  // Mês anterior
  const sumPrev = await prisma.expense.aggregate({
    where: { ...baseWhere, date: { gte: prevFrom, lte: prevTo } },
    _sum: { amount: true },
  });
  const totalPrevMonth: number = Number(sumPrev._sum.amount ?? 0);

  // Por veículo – mês atual
  const grouped = (await prisma.expense.groupBy({
    by: ["vehicleId"],
    where: { ...baseWhere, date: { gte: from, lte: to } },
    _sum: { amount: true },
  })) as unknown as GroupedByVehicle[];

  const vehicleIds: string[] = grouped.map(
    (g: GroupedByVehicle) => g.vehicleId
  );

  const vehicles = vehicleIds.length
    ? await prisma.vehicle.findMany({
        where: { id: { in: vehicleIds } },
        select: { id: true, nickname: true, plate: true },
      })
    : [];

  // Cria um Map para lookup O(1)
  const vehicleMap = new Map<
    string,
    { id: string; nickname: string | null; plate: string | null }
  >(vehicles.map((v) => [v.id, v]));

  const byVehicle: Array<{ vehicleId: string; label: string; total: number }> =
    grouped.map((g: GroupedByVehicle) => {
      const v = vehicleMap.get(g.vehicleId);
      const label = v?.nickname || v?.plate || "Veículo";
      return {
        vehicleId: g.vehicleId,
        label,
        total: Number(g._sum.amount ?? 0),
      };
    });

  // Série dos últimos 6 meses (inclui o atual)
  const lastMonths: Array<{ monthISO: string; total: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const mFrom = startOfMonth(subMonths(from, i));
    const mTo = endOfMonth(subMonths(from, i));
    const ag = await prisma.expense.aggregate({
      where: { ...baseWhere, date: { gte: mFrom, lte: mTo } },
      _sum: { amount: true },
    });
    lastMonths.push({
      monthISO: formatISO(mFrom, "month"),
      total: Number(ag._sum.amount ?? 0),
    });
  }

  const out: SummaryResponse = {
    monthISO: formatISO(from, "month"),
    totalThisMonth,
    totalPrevMonth,
    avgTicketThisMonth,
    countThisMonth,
    byVehicle: byVehicle.sort((a, b) => b.total - a.total),
    lastMonths,
  };

  return NextResponse.json(out, { status: 200 });
}

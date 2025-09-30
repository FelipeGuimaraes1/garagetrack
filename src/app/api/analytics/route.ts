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

type GroupedByVehicle = { vehicleId: string; _sum: { amount: number | null } };

/** GET /api/analytics?month=YYYY-MM&vehicleId=...&type=ABASTECIMENTO|MANUTENCAO|... */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // "2025-09"
  const vehicleId = searchParams.get("vehicleId") || ""; // vazio = todos
  const typeParam = searchParams.get("type") || ""; // vazio = todos

  const baseDate = monthParam
    ? new Date(`${monthParam}-01T00:00:00`)
    : new Date();
  const from = startOfMonth(baseDate);
  const to = endOfMonth(baseDate);

  const prevFrom = startOfMonth(subMonths(from, 1));
  const prevTo = endOfMonth(subMonths(from, 1));

  // where base: somente despesas pagas
  const baseWhere: any = { status: "PAGO" as const };
  if (vehicleId) baseWhere.vehicleId = vehicleId;
  if (typeParam) baseWhere.type = typeParam;

  // mês atual
  const [sumThis, countThis] = await Promise.all([
    prisma.expense.aggregate({
      where: { ...baseWhere, date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.expense.count({
      where: { ...baseWhere, date: { gte: from, lte: to } },
    }),
  ]);
  const totalThisMonth = Number(sumThis._sum.amount ?? 0);
  const countThisMonth = countThis;
  const avgTicketThisMonth = countThisMonth
    ? totalThisMonth / countThisMonth
    : 0;

  // mês anterior (mesmos filtros vehicleId/type)
  const sumPrev = await prisma.expense.aggregate({
    where: { ...baseWhere, date: { gte: prevFrom, lte: prevTo } },
    _sum: { amount: true },
  });
  const totalPrevMonth = Number(sumPrev._sum.amount ?? 0);

  // por veículo no mês atual (respeita o filtro de type; se já tem vehicleId, cairá 1 item)
  const grouped = (await prisma.expense.groupBy({
    by: ["vehicleId"],
    where: { ...baseWhere, date: { gte: from, lte: to } },
    _sum: { amount: true },
  })) as unknown as GroupedByVehicle[];

  const ids = grouped.map((g) => g.vehicleId);
  const vehicles =
    ids.length > 0
      ? await prisma.vehicle.findMany({
          where: { id: { in: ids } },
          select: { id: true, nickname: true, plate: true },
        })
      : [];

  const map = new Map(vehicles.map((v) => [v.id, v]));
  const byVehicle = grouped
    .map((g) => {
      const v = map.get(g.vehicleId);
      return {
        vehicleId: g.vehicleId,
        label: v?.nickname || v?.plate || "Veículo",
        total: Number(g._sum.amount ?? 0),
      };
    })
    .sort((a, b) => b.total - a.total);

  // série últimos 6 meses (sempre com os filtros atuais)
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
    byVehicle,
    lastMonths,
  };

  return NextResponse.json(out, { status: 200 });
}

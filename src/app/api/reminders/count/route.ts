export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import {
  computeKmStatusForRule,
  getCurrentOdometer,
} from "@/lib/utils/reminders";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.ceil(ms / 86_400_000);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ count: 0 }, { status: 200 });

  const { searchParams } = new URL(req.url);
  const onlyActive = searchParams.get("onlyActive") === "1";
  const vehicleId = searchParams.get("vehicleId") || undefined;

  // Busca todas as regras do usuário (opcionalmente filtra veículo + ativo)
  const rules = await prisma.reminderRule.findMany({
    where: {
      userId: session.user.id,
      ...(vehicleId ? { vehicleId } : {}),
      ...(onlyActive ? { isActive: true } : {}),
    },
    select: {
      id: true,
      vehicleId: true,
      everyKm: true,
      everyDays: true,
      lastDoneKm: true,
      lastDoneAt: true,
      dueDate: true,
      warnKmLeft: true,
      warnDaysLeft: true,
    },
  });

  // Cache de odômetro por veículo para não consultar N vezes
  const odoCache = new Map<string, number | null>();
  async function currentOdoFor(vId: string | null): Promise<number | null> {
    if (!vId) return null;
    if (odoCache.has(vId)) return odoCache.get(vId)!;
    const n = await getCurrentOdometer(vId);
    odoCache.set(vId, n);
    return n;
  }

  let attention = 0;
  const today = new Date();

  for (const r of rules) {
    // 1) Por KM
    if (r.everyKm != null) {
      const cur = await currentOdoFor(r.vehicleId);
      if (cur != null) {
        const baseline = r.lastDoneKm == null ? cur : r.lastDoneKm;
        const { status } = computeKmStatusForRule({
          everyKm: r.everyKm,
          lastDoneKm: baseline ?? 0,
          warnKmLeft: r.warnKmLeft ?? 500,
          currentOdo: cur,
        });
        if (status === "DUE_SOON" || status === "OVERDUE") {
          attention++;
          continue; // já contou
        }
      }
    }

    // 2) Por DATA (everyDays ou dueDate)
    if (r.everyDays != null || r.dueDate) {
      let daysLeft: number | null = null;

      if (r.everyDays != null) {
        const last = r.lastDoneAt ?? null;
        if (last) {
          const nextDue = new Date(last);
          nextDue.setUTCDate(nextDue.getUTCDate() + r.everyDays);
          daysLeft = daysBetween(today, nextDue);
        }
      }

      if (daysLeft == null && r.dueDate) {
        const due = new Date(r.dueDate);
        daysLeft = daysBetween(today, due);
      }

      if (daysLeft != null) {
        const warn = r.warnDaysLeft ?? 15;
        if (daysLeft <= 0 || daysLeft <= warn) {
          attention++;
        }
      }
    }
  }

  return NextResponse.json({ count: attention }, { status: 200 });
}

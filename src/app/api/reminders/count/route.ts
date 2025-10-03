export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** GET /api/reminders/count?onlyActive=1  */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ count: 0 }, { status: 200 });

  const { searchParams } = new URL(req.url);
  const onlyActive = searchParams.get("onlyActive") === "1";

  const count = await prisma.reminderRule.count({
    where: {
      userId: (session.user as any).id,
      ...(onlyActive ? { active: true } : {}),
    },
  });

  return NextResponse.json({ count }, { status: 200 });
}

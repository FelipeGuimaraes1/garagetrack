import { prisma } from "@/lib/utils/db";

export async function findOwnedVehicle(userId: string, vehicleId: string) {
  return prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
    select: { id: true, odometerKm: true },
  });
}

-- CreateEnum
CREATE TYPE "public"."ReminderType" AS ENUM ('OIL_CHANGE', 'SERVICE', 'DOCUMENT', 'FINE', 'CUSTOM');

-- CreateTable
CREATE TABLE "public"."ReminderRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "type" "public"."ReminderType" NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "everyKm" INTEGER,
    "everyDays" INTEGER,
    "lastDoneKm" INTEGER,
    "lastDoneAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "warnKmLeft" INTEGER DEFAULT 500,
    "warnDaysLeft" INTEGER DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderRule_userId_vehicleId_type_idx" ON "public"."ReminderRule"("userId", "vehicleId", "type");

-- AddForeignKey
ALTER TABLE "public"."ReminderRule" ADD CONSTRAINT "ReminderRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderRule" ADD CONSTRAINT "ReminderRule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

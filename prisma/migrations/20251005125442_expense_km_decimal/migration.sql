/*
  Warnings:

  - You are about to alter the column `km` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "public"."Expense" ALTER COLUMN "km" SET DATA TYPE DECIMAL(10,2);

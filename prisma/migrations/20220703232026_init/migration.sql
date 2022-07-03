-- CreateEnum
CREATE TYPE "RecurranceScheme" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'ANNUALLY');

-- CreateTable
CREATE TABLE "Tax" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pst" DOUBLE PRECISION NOT NULL,
    "gst" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SubType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrimaryType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PrimaryType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubtypesToPrimaryType" (
    "primaryTypeId" INTEGER NOT NULL,
    "subTypeId" INTEGER NOT NULL,

    CONSTRAINT "SubtypesToPrimaryType_pkey" PRIMARY KEY ("primaryTypeId","subTypeId")
);

-- CreateTable
CREATE TABLE "SingleExpense" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "has_gst" BOOLEAN NOT NULL DEFAULT true,
    "has_pst" BOOLEAN NOT NULL DEFAULT true,
    "primaryTypeId" INTEGER NOT NULL,
    "subTypeId" INTEGER NOT NULL,

    CONSTRAINT "SingleExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" SERIAL NOT NULL,
    "dateStarted" TIMESTAMP(3) NOT NULL,
    "dateEnded" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "frequency" "RecurranceScheme" NOT NULL,
    "dayRecurring" TIMESTAMP(3),
    "has_gst" BOOLEAN NOT NULL DEFAULT true,
    "has_pst" BOOLEAN NOT NULL DEFAULT true,
    "subTypeId" INTEGER NOT NULL,
    "primaryTypeId" INTEGER NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubType_name_key" ON "SubType"("name");

-- AddForeignKey
ALTER TABLE "SubtypesToPrimaryType" ADD CONSTRAINT "SubtypesToPrimaryType_subTypeId_fkey" FOREIGN KEY ("subTypeId") REFERENCES "SubType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtypesToPrimaryType" ADD CONSTRAINT "SubtypesToPrimaryType_primaryTypeId_fkey" FOREIGN KEY ("primaryTypeId") REFERENCES "PrimaryType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SingleExpense" ADD CONSTRAINT "SingleExpense_subTypeId_fkey" FOREIGN KEY ("subTypeId") REFERENCES "SubType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SingleExpense" ADD CONSTRAINT "SingleExpense_primaryTypeId_fkey" FOREIGN KEY ("primaryTypeId") REFERENCES "PrimaryType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_subTypeId_fkey" FOREIGN KEY ("subTypeId") REFERENCES "SubType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_primaryTypeId_fkey" FOREIGN KEY ("primaryTypeId") REFERENCES "PrimaryType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

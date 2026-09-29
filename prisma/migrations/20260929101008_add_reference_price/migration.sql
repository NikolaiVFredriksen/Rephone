-- CreateTable
CREATE TABLE "ReferencePrice" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "price" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferencePrice_pkey" PRIMARY KEY ("id")
);

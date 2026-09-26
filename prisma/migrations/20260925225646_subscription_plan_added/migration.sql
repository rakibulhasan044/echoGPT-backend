-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" "SubscriptionPlan" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stripePriceId" TEXT,
    "requestLimit" INTEGER NOT NULL DEFAULT 50,
    "benefits" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

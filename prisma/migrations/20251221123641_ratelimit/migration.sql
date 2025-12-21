-- CreateTable
CREATE TABLE "RateLimit" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_ip_route_key" ON "RateLimit"("ip", "route");

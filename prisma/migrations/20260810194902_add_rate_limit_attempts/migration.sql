-- CreateTable
CREATE TABLE "rate_limit_attempts" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_attempts_pkey" PRIMARY KEY ("key")
);

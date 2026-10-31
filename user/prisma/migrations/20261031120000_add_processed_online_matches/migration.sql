CREATE TABLE "ProcessedOnlineMatch" (
    "userId" INTEGER NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedOnlineMatch_pkey"
        PRIMARY KEY ("userId", "matchId")
);

CREATE INDEX "ProcessedOnlineMatch_createdAt_idx"
ON "ProcessedOnlineMatch"("createdAt");
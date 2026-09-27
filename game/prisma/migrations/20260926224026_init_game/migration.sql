-- CreateTable
CREATE TABLE "Match" (
    "id" BIGSERIAL NOT NULL,
    "mode" TEXT NOT NULL DEFAULT '1v1',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mazeSeed" TEXT,
    "timeLimitSeconds" INTEGER NOT NULL DEFAULT 360,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "winnerUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" BIGSERIAL NOT NULL,
    "matchId" BIGINT NOT NULL,
    "userId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "result" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "livesRemaining" INTEGER NOT NULL DEFAULT 3,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "Match"("createdAt");

-- CreateIndex
CREATE INDEX "MatchParticipant_userId_joinedAt_idx" ON "MatchParticipant"("userId", "joinedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_slot_key" ON "MatchParticipant"("matchId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_userId_key" ON "MatchParticipant"("matchId", "userId");

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

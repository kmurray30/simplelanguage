-- CreateTable
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizRun" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "deck" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "variantIndex" INTEGER NOT NULL,
    "given" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemStat" (
    "learnerId" TEXT NOT NULL,
    "deck" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "seen" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "lastWrongAt" TIMESTAMP(3),

    CONSTRAINT "ItemStat_pkey" PRIMARY KEY ("learnerId","deck","itemId")
);

-- CreateIndex
CREATE INDEX "QuizRun_learnerId_deck_createdAt_idx" ON "QuizRun"("learnerId", "deck", "createdAt");

-- CreateIndex
CREATE INDEX "QuizAnswer_runId_idx" ON "QuizAnswer"("runId");

-- AddForeignKey
ALTER TABLE "QuizRun" ADD CONSTRAINT "QuizRun_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_runId_fkey" FOREIGN KEY ("runId") REFERENCES "QuizRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemStat" ADD CONSTRAINT "ItemStat_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

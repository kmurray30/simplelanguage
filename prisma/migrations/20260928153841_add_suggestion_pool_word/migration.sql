-- CreateTable
CREATE TABLE "SuggestionPoolWord" (
    "id" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "nativeText" TEXT NOT NULL,
    "romanization" TEXT NOT NULL,
    "phonetic" TEXT NOT NULL,
    "englishGloss" TEXT NOT NULL,
    "usageNote" TEXT NOT NULL,
    "whyNext" TEXT NOT NULL,
    "category" "WordCategory" NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestionPoolWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuggestionPoolWord_languageCode_category_idx" ON "SuggestionPoolWord"("languageCode", "category");

-- CreateIndex
CREATE INDEX "SuggestionPoolWord_languageCode_rank_idx" ON "SuggestionPoolWord"("languageCode", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "SuggestionPoolWord_languageCode_nativeText_englishGloss_key" ON "SuggestionPoolWord"("languageCode", "nativeText", "englishGloss");

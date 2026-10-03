-- CreateTable
CREATE TABLE "Language" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultVoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "nativeText" TEXT NOT NULL,
    "romanization" TEXT NOT NULL,
    "phonetic" TEXT NOT NULL,
    "englishGloss" TEXT NOT NULL,
    "usageNote" TEXT,
    "audioClipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioClip" (
    "id" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "audioData" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioClip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Word_languageCode_idx" ON "Word"("languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "Word_languageCode_nativeText_englishGloss_key" ON "Word"("languageCode", "nativeText", "englishGloss");

-- CreateIndex
CREATE UNIQUE INDEX "AudioClip_languageCode_text_voiceId_key" ON "AudioClip"("languageCode", "text", "voiceId");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_languageCode_fkey" FOREIGN KEY ("languageCode") REFERENCES "Language"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_audioClipId_fkey" FOREIGN KEY ("audioClipId") REFERENCES "AudioClip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

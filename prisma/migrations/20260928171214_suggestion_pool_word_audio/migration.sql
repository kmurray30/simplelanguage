-- AlterTable
ALTER TABLE "SuggestionPoolWord" ADD COLUMN     "audioClipId" TEXT;

-- AddForeignKey
ALTER TABLE "SuggestionPoolWord" ADD CONSTRAINT "SuggestionPoolWord_audioClipId_fkey" FOREIGN KEY ("audioClipId") REFERENCES "AudioClip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

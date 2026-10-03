-- Words can belong to more than one learning-unit category (e.g. "hello" is both GREETINGS
-- and BASICS). Converts the single "category" enum column to a "categories" enum array,
-- preserving each row's existing category as the first element rather than dropping data -
-- a follow-up backfill script re-categorizes every row with the full relevant set via the LLM.

-- Word
ALTER TABLE "Word" ADD COLUMN "categories" "WordCategory"[] NOT NULL DEFAULT ARRAY[]::"WordCategory"[];
UPDATE "Word" SET "categories" = ARRAY["category"];
ALTER TABLE "Word" ALTER COLUMN "categories" DROP DEFAULT;
DROP INDEX IF EXISTS "Word_languageCode_category_idx";
ALTER TABLE "Word" DROP COLUMN "category";
CREATE INDEX "Word_categories_idx" ON "Word" USING GIN ("categories");

-- SuggestionPoolWord
ALTER TABLE "SuggestionPoolWord" ADD COLUMN "categories" "WordCategory"[] NOT NULL DEFAULT ARRAY[]::"WordCategory"[];
UPDATE "SuggestionPoolWord" SET "categories" = ARRAY["category"];
ALTER TABLE "SuggestionPoolWord" ALTER COLUMN "categories" DROP DEFAULT;
DROP INDEX IF EXISTS "SuggestionPoolWord_languageCode_category_idx";
ALTER TABLE "SuggestionPoolWord" DROP COLUMN "category";
CREATE INDEX "SuggestionPoolWord_categories_idx" ON "SuggestionPoolWord" USING GIN ("categories");

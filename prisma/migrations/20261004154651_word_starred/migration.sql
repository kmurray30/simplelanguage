-- Lets a user pin a word: starred words sort to the top of whatever filter is active, and a
-- dedicated "Starred" filter always shows them regardless of category.
ALTER TABLE "Word" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;

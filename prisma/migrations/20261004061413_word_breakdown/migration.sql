-- Adds a nullable breakdown field to Word: an LLM-generated memorization aid (morpheme/component
-- breakdown + useful etymology). Null until generated, either async right after word creation
-- or by the one-time backfill for words created before this feature existed.
ALTER TABLE "Word" ADD COLUMN "breakdown" TEXT;

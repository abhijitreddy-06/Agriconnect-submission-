-- Migration: Rename gemini_details column to prediction_result
-- Run this once on your live database to match the updated schema.
-- Safe to run multiple times (uses IF EXISTS check).

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'predictions' AND column_name = 'gemini_details'
    ) THEN
        ALTER TABLE predictions RENAME COLUMN gemini_details TO prediction_result;
        RAISE NOTICE 'Column gemini_details renamed to prediction_result.';
    ELSE
        RAISE NOTICE 'Column gemini_details does not exist (already migrated or fresh schema).';
    END IF;
END $$;

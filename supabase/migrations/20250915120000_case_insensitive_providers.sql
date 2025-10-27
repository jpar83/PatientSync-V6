/*
          # [Operation Name]
          Enforce Case-Insensitive Uniqueness for Insurance Providers

          ## Query Description: [This script adds a unique index and a trigger to the `insurance_providers` table. It ensures that all provider names are stored in a consistent uppercase format and prevents duplicate entries regardless of their original casing (e.g., 'AETNA' and 'aetna' will be treated as the same). This operation is safe and will not result in data loss, but it will enforce stricter data integrity rules going forward.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table: `insurance_providers`
          - Columns: `name`
          - Constraints: Adds a `UNIQUE` index.
          - Triggers: Adds a `BEFORE INSERT OR UPDATE` trigger.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [Added]
          - Estimated Impact: [Negligible impact on write performance for the `insurance_providers` table. Read performance may slightly improve for case-insensitive lookups.]
          */

-- Create a function to normalize the name to uppercase and trim whitespace.
CREATE OR REPLACE FUNCTION normalize_insurance_provider_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = UPPER(TRIM(NEW.name));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a unique index on the uppercased name to enforce case-insensitive uniqueness.
-- This prevents duplicates like 'Aetna' and 'aetna'.
CREATE UNIQUE INDEX IF NOT EXISTS insurance_providers_name_unique_ci_idx
ON public.insurance_providers (UPPER(name));

-- Drop the trigger if it already exists to ensure it's idempotent.
DROP TRIGGER IF EXISTS normalize_name_before_insert_or_update ON public.insurance_providers;

-- Create the trigger that fires before an insert or update on the table.
CREATE TRIGGER normalize_name_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.insurance_providers
FOR EACH ROW
EXECUTE FUNCTION normalize_insurance_provider_name();

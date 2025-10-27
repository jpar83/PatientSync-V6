/*
          # [Operation Name]
          Enforce Case-Insensitive Uniqueness for Insurance Providers

          ## Query Description: [This script enhances the `insurance_providers` table to prevent duplicate entries regardless of letter casing (e.g., 'Aetna' vs. 'AETNA'). It achieves this by adding a function and trigger to automatically convert all provider names to uppercase upon insertion or update, and by creating a unique index on the uppercased name. This ensures data integrity at the database level.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Adds a new function: `normalize_insurance_provider_name`
          - Adds a new trigger: `normalize_name_before_insert_update` on `insurance_providers`
          - Adds a new unique index: `insurance_name_unique_ci` on `insurance_providers`
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: Added `insurance_name_unique_ci`
          - Triggers: Added `normalize_name_before_insert_update`
          - Estimated Impact: Minimal performance impact on writes (inserts/updates) to the `insurance_providers` table. Read performance may improve for case-insensitive lookups.
          */

-- Step 1: Create a function to normalize the provider name.
-- This function trims whitespace and converts the name to uppercase.
CREATE OR REPLACE FUNCTION public.normalize_insurance_provider_name()
RETURNS trigger AS $$
BEGIN
  -- Trim whitespace and convert the name to uppercase before insertion or update.
  NEW.name = UPPER(TRIM(NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a trigger that executes the normalization function.
-- This ensures that every time a new provider is added or an existing one is updated,
-- its name is automatically standardized.
-- We drop the trigger first to ensure this script is re-runnable.
DROP TRIGGER IF EXISTS normalize_name_before_insert_update ON public.insurance_providers;
CREATE TRIGGER normalize_name_before_insert_update
  BEFORE INSERT OR UPDATE ON public.insurance_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_insurance_provider_name();

-- Step 3: Create a unique index on the uppercased name.
-- This is the database-level constraint that prevents duplicates like 'AETNA' and 'aetna'.
-- It works in conjunction with the trigger to enforce true case-insensitive uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS insurance_name_unique_ci ON public.insurance_providers (UPPER(name));

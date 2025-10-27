/*
          # [Operation Name]
          Normalize Insurance Providers

          ## Query Description: [This migration refactors the insurance provider system for data integrity.
          1. It adds a foreign key 'insurance_provider_id' to the 'patients' table.
          2. It creates a function and trigger to automatically uppercase and trim new provider names.
          3. It adds a unique, case-insensitive index to prevent duplicate provider names.
          4. It backfills the new foreign key for existing patients based on name matching.
          This operation is non-destructive but fundamentally changes how insurance data is stored.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - Adds 'insurance_provider_id' column to 'patients' table.
          - Adds foreign key constraint from 'patients' to 'insurance_providers'.
          - Adds a trigger 'trigger_normalize_insurance_provider_name' to 'insurance_providers'.
          - Adds a unique index 'insurance_name_unique_ci' to 'insurance_providers'.
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: Admin privileges
          
          ## Performance Impact:
          - Indexes: Added
          - Triggers: Added
          - Estimated Impact: Minor impact on writes to 'insurance_providers' table. Selects on 'patients' will be faster when joining on provider.
          */

-- Step 1: Add the foreign key column to the patients table if it doesn't exist.
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS insurance_provider_id UUID
REFERENCES public.insurance_providers(id) ON DELETE SET NULL;

-- Step 2: Create an index on the new foreign key column for performance.
CREATE INDEX IF NOT EXISTS idx_patients_on_insurance_provider_id
ON public.patients(insurance_provider_id);

-- Step 3: Create a function to normalize the insurance provider name to uppercase.
CREATE OR REPLACE FUNCTION normalize_insurance_provider_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = UPPER(TRIM(NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a trigger to run the normalization function before insert or update.
DROP TRIGGER IF EXISTS trigger_normalize_insurance_provider_name ON public.insurance_providers;
CREATE TRIGGER trigger_normalize_insurance_provider_name
BEFORE INSERT OR UPDATE ON public.insurance_providers
FOR EACH ROW EXECUTE FUNCTION normalize_insurance_provider_name();

-- Step 5: Add a unique, case-insensitive index to the insurance_providers table.
CREATE UNIQUE INDEX IF NOT EXISTS insurance_name_unique_ci
ON public.insurance_providers (UPPER(name));

-- Step 6: Backfill the new insurance_provider_id column for existing patients.
-- This query matches the text-based insurance name to the normalized name in the providers table.
UPDATE public.patients
SET insurance_provider_id = p.id
FROM public.insurance_providers AS p
WHERE UPPER(TRIM(public.patients.primary_insurance)) = p.name -- Assumes provider names are already uppercase from the trigger
AND public.patients.insurance_provider_id IS NULL;

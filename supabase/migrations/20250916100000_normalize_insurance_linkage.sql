-- Ensures all unique, normalized insurance names from patients exist in insurance_providers.
-- This will add any missing providers from legacy data.
INSERT INTO public.insurance_providers (name, source)
SELECT DISTINCT UPPER(TRIM(primary_insurance)), 'backfill'
FROM public.patients
WHERE primary_insurance IS NOT NULL AND TRIM(primary_insurance) != ''
ON CONFLICT (name) DO NOTHING;

-- Backfills the insurance_provider_id for existing patients that are not yet linked.
UPDATE public.patients p
SET insurance_provider_id = ip.id
FROM public.insurance_providers ip
WHERE UPPER(TRIM(p.primary_insurance)) = ip.name
  AND p.insurance_provider_id IS NULL;

-- Normalizes the text field for all existing patients for consistency.
UPDATE public.patients
SET primary_insurance = UPPER(TRIM(primary_insurance))
WHERE primary_insurance IS NOT NULL;

-- This function will run before any insert or update on the patients table.
CREATE OR REPLACE FUNCTION public.normalize_patient_insurance()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Normalize the primary_insurance text field to uppercase.
    IF NEW.primary_insurance IS NOT NULL THEN
        NEW.primary_insurance := UPPER(TRIM(NEW.primary_insurance));
    END IF;

    -- 2. If the insurance name is provided but the ID is not, this block will
    -- find the existing provider or create a new one, then link its ID.
    IF NEW.primary_insurance IS NOT NULL AND NEW.insurance_provider_id IS NULL THEN
        WITH provider AS (
            INSERT INTO public.insurance_providers (name, source)
            VALUES (NEW.primary_insurance, 'trigger')
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name -- This trick returns the ID of the existing row
            RETURNING id
        )
        SELECT id INTO NEW.insurance_provider_id FROM provider;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists to ensure the script is re-runnable.
DROP TRIGGER IF EXISTS trigger_normalize_patient_insurance ON public.patients;

-- Attach the trigger to the patients table.
CREATE TRIGGER trigger_normalize_patient_insurance
BEFORE INSERT OR UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.normalize_patient_insurance();

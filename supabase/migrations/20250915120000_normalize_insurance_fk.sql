-- Adds a foreign key to patients for insurance providers and backfills existing data.

-- Step 1: Add the insurance_provider_id column to the patients table if it doesn't exist.
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS insurance_provider_id UUID;

-- Step 2: Add the foreign key constraint if it doesn't exist.
-- This links the patients table to the centralized insurance_providers table.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'patients_insurance_provider_id_fkey'
        AND conrelid = 'public.patients'::regclass
    ) THEN
        ALTER TABLE public.patients
        ADD CONSTRAINT patients_insurance_provider_id_fkey
        FOREIGN KEY (insurance_provider_id)
        REFERENCES public.insurance_providers(id)
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- Step 3: Create a function to backfill the new foreign key for existing patients.
-- This function reads the old text-based insurance name, finds or creates a
-- corresponding entry in the insurance_providers table, and links it.
CREATE OR REPLACE FUNCTION public.backfill_patient_insurance_fks()
RETURNS void AS $$
DECLARE
    patient_record RECORD;
    provider_id UUID;
    normalized_name TEXT;
BEGIN
    FOR patient_record IN
        SELECT id, primary_insurance FROM public.patients
        WHERE insurance_provider_id IS NULL AND primary_insurance IS NOT NULL AND TRIM(primary_insurance) != ''
    LOOP
        normalized_name := UPPER(TRIM(patient_record.primary_insurance));

        -- Find or create the insurance provider
        SELECT id INTO provider_id FROM public.insurance_providers WHERE name = normalized_name;

        IF NOT FOUND THEN
            INSERT INTO public.insurance_providers (name, source)
            VALUES (normalized_name, 'backfill')
            RETURNING id INTO provider_id;
        END IF;

        -- Update the patient record with the foreign key
        UPDATE public.patients
        SET insurance_provider_id = provider_id
        WHERE id = patient_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Execute the backfill function to migrate existing data.
SELECT public.backfill_patient_insurance_fks();

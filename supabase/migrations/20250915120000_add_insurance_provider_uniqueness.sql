-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.insurance_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    source text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.insurance_providers OWNER TO postgres;

-- Add primary key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conrelid = 'public.insurance_providers'::regclass
        AND    conname = 'insurance_providers_pkey'
    ) THEN
        ALTER TABLE public.insurance_providers ADD CONSTRAINT insurance_providers_pkey PRIMARY KEY (id);
    END IF;
END;
$$;

-- Create function to normalize name
CREATE OR REPLACE FUNCTION public.normalize_insurance_provider_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.name := UPPER(TRIM(NEW.name));
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.normalize_insurance_provider_name() OWNER TO postgres;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS normalize_name_before_insert_or_update ON public.insurance_providers;
CREATE TRIGGER normalize_name_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.insurance_providers
FOR EACH ROW EXECUTE FUNCTION public.normalize_insurance_provider_name();

-- Create unique index on the uppercase name if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS insurance_name_unique_ci ON public.insurance_providers (UPPER(name));

-- Enable RLS
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.insurance_providers;
CREATE POLICY "Enable read access for authenticated users"
ON public.insurance_providers
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.insurance_providers;
CREATE POLICY "Enable insert for authenticated users"
ON public.insurance_providers
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.insurance_providers;
CREATE POLICY "Enable update for authenticated users"
ON public.insurance_providers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.insurance_providers;
CREATE POLICY "Enable delete for authenticated users"
ON public.insurance_providers
FOR DELETE
TO authenticated
USING (true);

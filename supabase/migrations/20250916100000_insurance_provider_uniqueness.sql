DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'insurance_providers') THEN
        CREATE TABLE public.insurance_providers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            source TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;

    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='insurance_providers' AND column_name='source') THEN
        ALTER TABLE public.insurance_providers ADD COLUMN source TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='insurance_providers' AND column_name='updated_at') THEN
        ALTER TABLE public.insurance_providers ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    -- Enable RLS if not already enabled
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'insurance_providers') THEN
        ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create policies if they don't exist
    IF NOT EXISTS (SELECT FROM pg_policy WHERE polname = 'Allow authenticated read access' AND polrelid = 'public.insurance_providers'::regclass) THEN
        CREATE POLICY "Allow authenticated read access" ON public.insurance_providers FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policy WHERE polname = 'Allow individual insert access' AND polrelid = 'public.insurance_providers'::regclass) THEN
        CREATE POLICY "Allow individual insert access" ON public.insurance_providers FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policy WHERE polname = 'Allow individual update access' AND polrelid = 'public.insurance_providers'::regclass) THEN
        CREATE POLICY "Allow individual update access" ON public.insurance_providers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT FROM pg_policy WHERE polname = 'Allow individual delete access' AND polrelid = 'public.insurance_providers'::regclass) THEN
        CREATE POLICY "Allow individual delete access" ON public.insurance_providers FOR DELETE TO authenticated USING (true);
    END IF;

    -- Create a case-insensitive unique index if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'insurance_providers_name_ci_unique_idx') THEN
        CREATE UNIQUE INDEX insurance_providers_name_ci_unique_idx ON public.insurance_providers (UPPER(name));
    END IF;
END;
$$;

-- Create functions and triggers (these are idempotent with CREATE OR REPLACE and DROP/CREATE)
CREATE OR REPLACE FUNCTION normalize_insurance_provider_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name := UPPER(TRIM(NEW.name));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_insurance_provider_insert_normalize_name ON public.insurance_providers;
CREATE TRIGGER on_insurance_provider_insert_normalize_name
BEFORE INSERT OR UPDATE ON public.insurance_providers
FOR EACH ROW
EXECUTE FUNCTION normalize_insurance_provider_name();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_insurance_provider_update_set_timestamp ON public.insurance_providers;
CREATE TRIGGER on_insurance_provider_update_set_timestamp
BEFORE UPDATE ON public.insurance_providers
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

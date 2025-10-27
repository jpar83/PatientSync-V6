/*
          # Create Insurance Providers Table
          This script creates the `insurance_providers` table to serve as a single source of truth for all insurance payers.

          ## Query Description: 
          This operation creates a new table and is non-destructive to existing data. It adds a unique, case-insensitive index on the provider's name to prevent duplicate entries (e.g., "UHC" and "uhc"). Row Level Security is enabled with policies that allow authenticated users to read and add providers, while restricting updates and deletes to admin users.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - New Table: `public.insurance_providers`
          - Columns: `id`, `created_at`, `name`, `source`
          - New Index: `insurance_providers_name_idx` (case-insensitive unique)

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (Adds policies for read, insert, update, delete)
          - Auth Requirements: `authenticated` role for read/insert, `admin` role for update/delete.

          ## Performance Impact:
          - Indexes: Added
          - Triggers: None
          - Estimated Impact: Minimal. The new index will slightly slow down inserts but significantly speed up lookups by name.
*/

CREATE TABLE IF NOT EXISTS public.insurance_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    source text DEFAULT 'manual'::text
);

ALTER TABLE ONLY public.insurance_providers
    ADD CONSTRAINT insurance_providers_pkey PRIMARY KEY (id);

-- Add a case-insensitive unique index on the name
CREATE UNIQUE INDEX IF NOT EXISTS insurance_providers_name_idx ON public.insurance_providers USING btree (lower(name));

-- Enable RLS and define policies
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.insurance_providers;
CREATE POLICY "Allow authenticated read access" ON public.insurance_providers
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.insurance_providers;
CREATE POLICY "Allow authenticated insert" ON public.insurance_providers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin update" ON public.insurance_providers;
CREATE POLICY "Allow admin update" ON public.insurance_providers
    FOR UPDATE
    TO authenticated
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Allow admin delete" ON public.insurance_providers;
CREATE POLICY "Allow admin delete" ON public.insurance_providers
    FOR DELETE
    TO authenticated
    USING ((SELECT role FROM public.profiles WHERE id = 'admin'));

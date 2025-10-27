/*
  # Create Insurance Providers Table
  This migration creates the `insurance_providers` table to store a list of insurance companies.

  ## Query Description: 
  This operation creates a new table named `public.insurance_providers`. It will not affect any existing data as the table is new. This is a safe, structural change required for the insurance management feature to function correctly.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (Can be dropped if needed)

  ## Structure Details:
  - Table: `public.insurance_providers`
  - Columns:
    - `id`: UUID, Primary Key
    - `created_at`: Timestamptz, default now()
    - `name`: text, not null, unique

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes, a new policy is created.
  - Auth Requirements: Authenticated users will have full CRUD access.

  ## Performance Impact:
  - Indexes: Primary key index on `id` and unique index on `name` will be created.
  - Triggers: None
  - Estimated Impact: Negligible performance impact.
*/

-- Create the table for insurance providers
CREATE TABLE public.insurance_providers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    CONSTRAINT insurance_providers_pkey PRIMARY KEY (id),
    CONSTRAINT insurance_providers_name_key UNIQUE (name)
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.insurance_providers IS 'Stores a list of insurance companies or payers.';
COMMENT ON COLUMN public.insurance_providers.name IS 'The unique name of the insurance provider.';

-- Enable Row Level Security
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

-- Create policies for access
-- This policy allows any authenticated user to perform all actions (select, insert, update, delete).
-- This is suitable for an internal tool where all users are trusted.
CREATE POLICY "Allow all access to authenticated users"
ON public.insurance_providers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

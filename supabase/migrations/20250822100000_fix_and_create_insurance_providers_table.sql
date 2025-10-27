/*
# [Fix] Create Insurance Providers Table
[This migration creates the `insurance_providers` table to store a canonical list of insurance payers. It ensures the table is created correctly with a single primary key and a unique constraint on the provider name to prevent duplicates.]

## Query Description: [This script creates the `insurance_providers` table if it does not already exist. It sets up a primary key and a unique index on the provider's name to maintain data integrity. It is a safe, non-destructive operation.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tables-Affected: ["insurance_providers"]
- Columns-Added: ["id", "name", "source", "created_at"]
- Constraints-Added: ["PRIMARY KEY on id", "UNIQUE index on lower(name)"]

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [authenticated users can read, service_role for write]

## Performance Impact:
- Indexes: [Added]
- Triggers: [None]
- Estimated Impact: [Low. Adds a new table and index.]
*/

-- Create the table for insurance providers if it doesn't already exist.
create table if not exists public.insurance_providers (
  id uuid not null default gen_random_uuid(),
  name text not null,
  source text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone default now()
);

-- Ensure RLS is enabled on the new table
alter table public.insurance_providers enable row level security;

-- This block adds a PK only if one doesn't exist, preventing errors on re-runs.
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conrelid = 'public.insurance_providers'::regclass
       AND contype = 'p'
   ) THEN
       ALTER TABLE public.insurance_providers ADD PRIMARY KEY (id);
   END IF;
END;
$$;


-- Add a unique index on the lowercase name to prevent duplicates like "UHC" and "uhc".
CREATE UNIQUE INDEX IF NOT EXISTS insurance_providers_name_idx ON public.insurance_providers (lower(name));

-- Add RLS policies
-- Allow authenticated users to read all providers.
drop policy if exists "Allow authenticated read access" on public.insurance_providers;
create policy "Allow authenticated read access"
on public.insurance_providers
for select
to authenticated
using (true);

-- Allow service_role to perform all actions (for backend functions/inserts).
drop policy if exists "Allow service_role all access" on public.insurance_providers;
create policy "Allow service_role all access"
on public.insurance_providers
for all
to service_role
using (true);

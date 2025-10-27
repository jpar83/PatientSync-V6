/*
# [Fix] Correct Marketing Hub Schema and Policies
This script corrects the database schema for the Marketing Hub features. It addresses a recurring error where a security policy was referencing a non-existent 'user_id' column on the 'marketing_leads' table.

## Query Description:
This script is designed to be run safely, even if previous migrations have partially completed. It will:
1. Create the necessary tables (`marketing_leads`, `marketing_touchpoints`, `marketing_in_services`) if they do not already exist.
2. Ensure Row Level Security (RLS) is enabled on these tables.
3. Drop any old, incorrect security policies that may be causing errors.
4. Create the correct security policies, ensuring that data access is properly restricted to the record's owner.

This operation is primarily structural and should not result in data loss. It is designed to fix the schema and make the Marketing features functional.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables created (if not exist): `marketing_leads`, `marketing_touchpoints`, `marketing_in_services`
- Policies corrected on: `marketing_leads`
- Policies created/recreated on: `marketing_touchpoints`, `marketing_in_services`

## Security Implications:
- RLS Status: Enabled on all marketing tables.
- Policy Changes: Yes. Corrects a faulty policy on `marketing_leads` and ensures correct policies are in place for all marketing tables.
- Auth Requirements: Policies are based on `auth.uid()`, restricting access to the user who created the record.

## Performance Impact:
- Indexes: Primary key indexes are created with the tables.
- Triggers: None.
- Estimated Impact: Negligible performance impact. This is a one-time structural fix.
*/

-- Step 1: Create tables if they don't exist to handle partial migrations.

CREATE TABLE IF NOT EXISTS public.marketing_leads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    type text,
    city text,
    state text,
    status text DEFAULT 'Prospect'::text,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    interests text[],
    notes text,
    CONSTRAINT marketing_leads_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.marketing_touchpoints (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    lead_id uuid REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    channel text,
    purpose text,
    notes text,
    outcome text,
    next_step text,
    follow_up_date date,
    CONSTRAINT marketing_touchpoints_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.marketing_in_services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    lead_id uuid REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    topic text NOT NULL,
    date_time timestamp with time zone NOT NULL,
    location text,
    status text DEFAULT 'Proposed'::text,
    CONSTRAINT marketing_in_services_pkey PRIMARY KEY (id)
);

-- Step 2: Ensure RLS is enabled on all tables.
-- It's safe to run this command even if RLS is already enabled.
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_in_services ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop any potentially incorrect policies on marketing_leads.
-- This specifically targets the policy that was likely causing the "user_id" error.
DROP POLICY IF EXISTS "Enable all access for users based on user_id" ON public.marketing_leads;
DROP POLICY IF EXISTS "Enable read access for owner" ON public.marketing_leads;
DROP POLICY IF EXISTS "Enable insert for owner" ON public.marketing_leads;
DROP POLICY IF EXISTS "Enable update for owner" ON public.marketing_leads;
DROP POLICY IF EXISTS "Enable delete for owner" ON public.marketing_leads;
DROP POLICY IF EXISTS "Enable all access for owner" ON public.marketing_leads;


-- Step 4: Create the CORRECT policy for marketing_leads using `owner_id`.
CREATE POLICY "Enable all access for owner" ON public.marketing_leads
FOR ALL USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);


-- Step 5: Drop and recreate policies for other tables to ensure consistency.
DROP POLICY IF EXISTS "Enable all for owner" ON public.marketing_touchpoints;
CREATE POLICY "Enable all for owner" ON public.marketing_touchpoints
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable all for owner" ON public.marketing_in_services;
CREATE POLICY "Enable all for owner" ON public.marketing_in_services
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

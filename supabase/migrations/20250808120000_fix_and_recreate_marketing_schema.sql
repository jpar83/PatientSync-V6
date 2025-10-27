/*
# [Fix & Recreate] Marketing Hub Schema
This script creates and configures the necessary tables for the Marketing Hub, including leads, touchpoints, and in-services. It corrects a previous error in the Row Level Security (RLS) policy for the `marketing_leads` table.

## Query Description:
- This script is designed to be safe to re-run. It uses `IF NOT EXISTS` for table creation and `DROP/CREATE` for policies to avoid errors on partially migrated databases.
- It will create three tables: `marketing_leads`, `marketing_touchpoints`, and `marketing_in_services`.
- It will enable Row Level Security on these tables and create policies to ensure users can only access their own data.
- No existing data will be lost if the tables already exist.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the created tables and policies)

## Structure Details:
- Tables created: `marketing_leads`, `marketing_touchpoints`, `marketing_in_services`
- Columns added: Various columns for marketing data.
- Constraints added: Foreign keys linking tables to `auth.users` and each other.

## Security Implications:
- RLS Status: Enabled on all three new tables.
- Policy Changes: Yes. Policies are created to restrict data access to the record owner.
- Auth Requirements: Users must be authenticated to interact with these tables.

## Performance Impact:
- Indexes: Primary keys and foreign keys are indexed by default.
- Triggers: None.
- Estimated Impact: Low.
*/

-- 1. Marketing Leads Table
CREATE TABLE IF NOT EXISTS public.marketing_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    type text,
    city text,
    state text,
    status text,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    interests text,
    notes text
);

-- 2. Marketing Touchpoints (Journal) Table
CREATE TABLE IF NOT EXISTS public.marketing_touchpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lead_id uuid REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    channel text,
    purpose text,
    notes text,
    outcome text,
    next_step text,
    follow_up_date date
);

-- 3. Marketing In-Services (Calendar) Table
CREATE TABLE IF NOT EXISTS public.marketing_in_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    topic text NOT NULL,
    date_time timestamp with time zone NOT NULL,
    location text,
    host_contact_id uuid,
    status text,
    lead_id uuid REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_in_services ENABLE ROW LEVEL SECURITY;

-- Policies for marketing_leads
-- This is the corrected policy, using `owner_id`
DROP POLICY IF EXISTS "Users can manage their own marketing leads" ON public.marketing_leads;
CREATE POLICY "Users can manage their own marketing leads"
ON public.marketing_leads
FOR ALL
USING (auth.uid() = owner_id);

-- Policies for marketing_touchpoints
DROP POLICY IF EXISTS "Users can manage their own touchpoints" ON public.marketing_touchpoints;
CREATE POLICY "Users can manage their own touchpoints"
ON public.marketing_touchpoints
FOR ALL
USING (auth.uid() = user_id);

-- Policies for marketing_in_services
DROP POLICY IF EXISTS "Users can manage their own in-services" ON public.marketing_in_services;
CREATE POLICY "Users can manage their own in-services"
ON public.marketing_in_services
FOR ALL
USING (auth.uid() = user_id);

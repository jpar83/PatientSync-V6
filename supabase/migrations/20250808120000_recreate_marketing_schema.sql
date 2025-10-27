/*
          # [Operation Name]
          Recreate Marketing Hub Schema

          ## Query Description: [This script will completely reset and rebuild the tables required for the Marketing Hub features (Leads, Journal, Calendar). It first removes any existing, partially-created marketing tables and their dependencies, then creates them with the correct structure and security policies. This is a safe operation for the marketing feature as it ensures a clean state, but it will remove any data that might have been added to these specific tables during previous failed attempts.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops and recreates: `marketing_leads`, `marketing_contacts`, `marketing_touchpoints`, `marketing_in_services`
          - Creates RLS policies for all tables.
          - Creates the `get_marketing_leads_with_summary` function.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Authenticated users]
          
          ## Performance Impact:
          - Indexes: [Primary keys created]
          - Triggers: [None]
          - Estimated Impact: [Low. Affects only the marketing feature tables.]
          */

-- Step 1: Drop all marketing-related tables and their dependencies safely.
-- This uses CASCADE to resolve the dependency error you encountered.
DROP TABLE IF EXISTS public.marketing_leads CASCADE;
DROP TABLE IF EXISTS public.marketing_contacts CASCADE;
DROP TABLE IF EXISTS public.marketing_touchpoints CASCADE;
DROP TABLE IF EXISTS public.marketing_in_services CASCADE;

-- Step 2: Recreate the marketing_leads table
CREATE TABLE public.marketing_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    type text,
    city text,
    state text,
    status text DEFAULT 'Prospect'::text,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    interests text[],
    notes text
);

-- Step 3: Recreate the marketing_contacts table
CREATE TABLE public.marketing_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    name text NOT NULL,
    role text,
    email text,
    phone text
);

-- Step 4: Recreate the marketing_touchpoints table
CREATE TABLE public.marketing_touchpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    channel text,
    purpose text,
    notes text,
    outcome text,
    next_step text,
    follow_up_date date
);

-- Step 5: Recreate the marketing_in_services table
CREATE TABLE public.marketing_in_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    topic text NOT NULL,
    date_time timestamp with time zone NOT NULL,
    location text,
    host_contact_id uuid REFERENCES public.marketing_contacts(id) ON DELETE SET NULL,
    status text DEFAULT 'Proposed'::text
);

-- Step 6: Enable Row Level Security for all new tables
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_in_services ENABLE ROW LEVEL SECURITY;

-- Step 7: Create security policies for marketing_leads
CREATE POLICY "Enable read access for authenticated users" ON public.marketing_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.marketing_leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for owner" ON public.marketing_leads FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Enable delete for owner" ON public.marketing_leads FOR DELETE USING (auth.uid() = owner_id);

-- Step 8: Create security policies for marketing_contacts
CREATE POLICY "Enable read access for authenticated users" ON public.marketing_contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.marketing_contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.marketing_contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.marketing_contacts FOR DELETE USING (auth.role() = 'authenticated');

-- Step 9: Create security policies for marketing_touchpoints
CREATE POLICY "Enable read access for authenticated users" ON public.marketing_touchpoints FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for own records" ON public.marketing_touchpoints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for owner" ON public.marketing_touchpoints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for owner" ON public.marketing_touchpoints FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create security policies for marketing_in_services
CREATE POLICY "Enable read access for authenticated users" ON public.marketing_in_services FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for own records" ON public.marketing_in_services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for owner" ON public.marketing_in_services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for owner" ON public.marketing_in_services FOR DELETE USING (auth.uid() = user_id);

-- Step 11: Recreate the helper function for the dashboard
CREATE OR REPLACE FUNCTION public.get_marketing_leads_with_summary()
RETURNS TABLE(id uuid, created_at timestamp with time zone, name text, type text, city text, state text, status text, owner_id uuid, interests text[], notes text, last_contact_date timestamp with time zone, last_contact_purpose text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH last_touch AS (
    SELECT
      lead_id,
      MAX(created_at) AS last_contact_date
    FROM public.marketing_touchpoints
    GROUP BY lead_id
  )
  SELECT
    l.id,
    l.created_at,
    l.name,
    l.type,
    l.city,
    l.state,
    l.status,
    l.owner_id,
    l.interests,
    l.notes,
    lt.last_contact_date,
    mt.purpose AS last_contact_purpose
  FROM public.marketing_leads l
  LEFT JOIN last_touch lt ON l.id = lt.lead_id
  LEFT JOIN public.marketing_touchpoints mt ON mt.lead_id = lt.lead_id AND mt.created_at = lt.last_contact_date
  ORDER BY l.name;
$$;

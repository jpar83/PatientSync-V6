/*
# Idempotent Marketing Hub Schema Setup
[This script safely creates the necessary tables and security policies for the Marketing Hub features (Leads, Journal, Calendar). It is designed to be run multiple times without causing errors by checking for the existence of objects before creating them. This will resolve the "relation already exists" error.]

## Query Description: [This operation sets up the required database structure for the marketing module. It is non-destructive and will only add missing tables and policies, making it safe to run on existing databases.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Tables created (if not exist): marketing_leads, marketing_touchpoints, marketing_in_services
- Policies created/replaced: RLS policies for all three tables to ensure users can only access their own data.

## Security Implications:
- RLS Status: Enabled on all three new tables.
- Policy Changes: Yes, policies are defined to restrict access based on the authenticated user.
- Auth Requirements: Policies are based on the authenticated user's ID.

## Performance Impact:
- Indexes: Primary keys and foreign keys are indexed.
- Triggers: None.
- Estimated Impact: Low, standard table creation.
*/

-- Create marketing_leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketing_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    type text,
    city text,
    state text,
    status text DEFAULT 'Prospect'::text,
    owner_id uuid,
    interests text,
    notes text,
    CONSTRAINT marketing_leads_pkey PRIMARY KEY (id),
    CONSTRAINT marketing_leads_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create marketing_touchpoints table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketing_touchpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid,
    channel text,
    purpose text,
    notes text,
    outcome text,
    next_step text,
    follow_up_date date,
    CONSTRAINT marketing_touchpoints_pkey PRIMARY KEY (id),
    CONSTRAINT marketing_touchpoints_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    CONSTRAINT marketing_touchpoints_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create marketing_in_services table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketing_in_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid,
    topic text NOT NULL,
    date_time timestamp with time zone NOT NULL,
    location text,
    host_contact_id uuid,
    status text DEFAULT 'Proposed'::text,
    CONSTRAINT marketing_in_services_pkey PRIMARY KEY (id),
    CONSTRAINT marketing_in_services_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    CONSTRAINT marketing_in_services_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all three tables
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_in_services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts, then recreate them correctly.
-- Policies for marketing_leads
DROP POLICY IF EXISTS "Users can view their own leads." ON public.marketing_leads;
CREATE POLICY "Users can view their own leads." ON public.marketing_leads FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own leads." ON public.marketing_leads;
CREATE POLICY "Users can insert their own leads." ON public.marketing_leads FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own leads." ON public.marketing_leads;
CREATE POLICY "Users can update their own leads." ON public.marketing_leads FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own leads." ON public.marketing_leads;
CREATE POLICY "Users can delete their own leads." ON public.marketing_leads FOR DELETE USING (auth.uid() = owner_id);


-- Policies for marketing_touchpoints
DROP POLICY IF EXISTS "Users can view their own touchpoints." ON public.marketing_touchpoints;
CREATE POLICY "Users can view their own touchpoints." ON public.marketing_touchpoints FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own touchpoints." ON public.marketing_touchpoints;
CREATE POLICY "Users can insert their own touchpoints." ON public.marketing_touchpoints FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own touchpoints." ON public.marketing_touchpoints;
CREATE POLICY "Users can update their own touchpoints." ON public.marketing_touchpoints FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own touchpoints." ON public.marketing_touchpoints;
CREATE POLICY "Users can delete their own touchpoints." ON public.marketing_touchpoints FOR DELETE USING (auth.uid() = user_id);


-- Policies for marketing_in_services
DROP POLICY IF EXISTS "Users can view their own in-services." ON public.marketing_in_services;
CREATE POLICY "Users can view their own in-services." ON public.marketing_in_services FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own in-services." ON public.marketing_in_services;
CREATE POLICY "Users can insert their own in-services." ON public.marketing_in_services FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own in-services." ON public.marketing_in_services;
CREATE POLICY "Users can update their own in-services." ON public.marketing_in_services FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own in-services." ON public.marketing_in_services;
CREATE POLICY "Users can delete their own in-services." ON public.marketing_in_services FOR DELETE USING (auth.uid() = user_id);

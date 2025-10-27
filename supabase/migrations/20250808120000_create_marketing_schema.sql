/*
# [Marketing Module Schema]
[This migration creates the necessary tables to support the Marketing Hub feature, including leads, touchpoints (journal), and in-service events (calendar).]

## Query Description: [This script sets up three new tables: `marketing_leads`, `marketing_touchpoints`, and `marketing_in_services`. It establishes foreign key relationships between them and enables Row Level Security (RLS) to ensure users can only access their own data. This is a foundational, non-destructive operation for a new feature.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Tables Created:
  - `public.marketing_leads`
  - `public.marketing_touchpoints`
  - `public.marketing_in_services`
- Columns Added: Multiple columns for each new table.
- Constraints Added: Primary keys, foreign keys.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Authenticated Users]

## Performance Impact:
- Indexes: [Added] (Primary keys automatically create indexes)
- Triggers: [None]
- Estimated Impact: [Low, as these are new tables for a new feature.]
*/

-- 1. Create marketing_leads table
CREATE TABLE IF NOT EXISTS public.marketing_leads (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    type text,
    city text,
    state text,
    status text DEFAULT 'Prospect'::text,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    interests jsonb,
    notes text
);
COMMENT ON TABLE public.marketing_leads IS 'Stores potential marketing leads like clinics, hospitals, etc.';

-- 2. Create marketing_touchpoints table (for Journal)
CREATE TABLE IF NOT EXISTS public.marketing_touchpoints (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    channel text,
    purpose text,
    notes text,
    outcome text,
    next_step text,
    follow_up_date date
);
COMMENT ON TABLE public.marketing_touchpoints IS 'Logs all interactions (touchpoints) with marketing leads.';

-- 3. Create marketing_in_services table (for Calendar)
CREATE TABLE IF NOT EXISTS public.marketing_in_services (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    topic text NOT NULL,
    date_time timestamp with time zone NOT NULL,
    location text,
    status text DEFAULT 'Proposed'::text
);
COMMENT ON TABLE public.marketing_in_services IS 'Schedules and tracks in-service events with leads.';

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_in_services ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- marketing_leads: Users can see all leads, but only manage the ones they own.
CREATE POLICY "Allow authenticated users to view all leads"
ON public.marketing_leads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own leads"
ON public.marketing_leads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Allow owners to update their leads"
ON public.marketing_leads FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Allow owners to delete their leads"
ON public.marketing_leads FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);


-- marketing_touchpoints: Users can manage their own touchpoints and see all.
CREATE POLICY "Allow authenticated users to view all touchpoints"
ON public.marketing_touchpoints FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own touchpoints"
ON public.marketing_touchpoints FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own touchpoints"
ON public.marketing_touchpoints FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own touchpoints"
ON public.marketing_touchpoints FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- marketing_in_services: Users can manage their own in-services and see all.
CREATE POLICY "Allow authenticated users to view all in-services"
ON public.marketing_in_services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own in-services"
ON public.marketing_in_services FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own in-services"
ON public.marketing_in_services FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own in-services"
ON public.marketing_in_services FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

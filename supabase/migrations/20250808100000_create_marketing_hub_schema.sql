/*
# [CREATE] Marketing Hub Schema
Creates the necessary tables and policies for the Marketing Hub features (Leads, Journal, Calendar). This script corrects a previous version that had an error in a security policy.

## Query Description: 
This operation creates three new tables: 'marketing_leads', 'marketing_touchpoints', and 'marketing_in_services'. It also enables Row Level Security and sets up policies to ensure users can only access and manage their own data. This is a structural change and does not affect existing data in other tables.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables Created: public.marketing_leads, public.marketing_touchpoints, public.marketing_in_services
- Columns Added: Various columns for each table, including foreign keys to `auth.users`.
- Constraints Added: Primary keys, Foreign keys, NOT NULL constraints.

## Security Implications:
- RLS Status: Enabled on all three new tables.
- Policy Changes: Yes, new policies are created to restrict data access to the record owner.
- Auth Requirements: Users must be authenticated to interact with these tables.

## Performance Impact:
- Indexes: Primary key indexes are automatically created.
- Triggers: None.
- Estimated Impact: Low. Initial setup operation.
*/

-- Create marketing_leads table
CREATE TABLE public.marketing_leads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    type text,
    city text,
    state text,
    status text DEFAULT 'Prospect'::text,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    interests text,
    notes text,
    CONSTRAINT marketing_leads_pkey PRIMARY KEY (id)
);

-- Create marketing_touchpoints table (for journal)
CREATE TABLE public.marketing_touchpoints (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    channel text,
    purpose text,
    notes text,
    outcome text,
    next_step text,
    follow_up_date date,
    CONSTRAINT marketing_touchpoints_pkey PRIMARY KEY (id)
);

-- Create marketing_in_services table (for calendar)
CREATE TABLE public.marketing_in_services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    topic text NOT NULL,
    date_time timestamp with time zone NOT NULL,
    location text,
    status text DEFAULT 'Proposed'::text,
    CONSTRAINT marketing_in_services_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_in_services ENABLE ROW LEVEL SECURITY;

-- Policies for marketing_leads
CREATE POLICY "Allow users to manage their own leads"
ON public.marketing_leads
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Policies for marketing_touchpoints
CREATE POLICY "Allow users to manage their own touchpoints"
ON public.marketing_touchpoints
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for marketing_in_services
CREATE POLICY "Allow users to manage their own in-services"
ON public.marketing_in_services
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

/*
          # [Operation Name]
          Create Marketing Hub Tables

          ## Query Description: [This script creates the foundational tables for the new Marketing feature, including leads, contacts, and touchpoints. It enables Row Level Security and sets up basic policies to ensure only authenticated users can access their data. This is a non-destructive operation that adds new tables without affecting existing data.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Creates table: marketing_leads
          - Creates table: marketing_contacts
          - Creates table: marketing_touchpoints
          
          ## Security Implications:
          - RLS Status: [Enabled] on new tables
          - Policy Changes: [Yes] - adds new policies for the new tables
          - Auth Requirements: [Authenticated Users]
          
          ## Performance Impact:
          - Indexes: [Added] primary keys and foreign keys
          - Triggers: [None]
          - Estimated Impact: [Low - adds new tables, does not modify existing query paths.]
          */

-- Create marketing_leads table
CREATE TABLE IF NOT EXISTS public.marketing_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    name text NOT NULL,
    type text,
    city text,
    state text,
    status text DEFAULT 'Prospect'::text,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.marketing_leads IS 'Stores potential business leads like clinics, hospitals, etc.';

-- Create marketing_contacts table
CREATE TABLE IF NOT EXISTS public.marketing_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    lead_id uuid REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    name text NOT NULL,
    title text,
    email text,
    phone text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.marketing_contacts IS 'Stores individual contacts associated with a marketing lead.';

-- Create marketing_touchpoints table
CREATE TABLE IF NOT EXISTS public.marketing_touchpoints (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    lead_id uuid REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES public.marketing_contacts(id) ON DELETE SET NULL,
    channel text,
    purpose text,
    notes text,
    outcome text,
    follow_up_date timestamptz,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.marketing_touchpoints IS 'Logs interactions with leads and contacts.';

-- Enable RLS on the new tables
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_touchpoints ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the new tables
-- Allow authenticated users to read all marketing data
CREATE POLICY "Allow authenticated read access" ON public.marketing_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.marketing_contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.marketing_touchpoints FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own data
CREATE POLICY "Allow individual insert" ON public.marketing_leads FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow individual insert" ON public.marketing_contacts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow individual insert" ON public.marketing_touchpoints FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own data
CREATE POLICY "Allow individual update" ON public.marketing_leads FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Allow individual update" ON public.marketing_contacts FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Allow individual update" ON public.marketing_touchpoints FOR UPDATE USING (auth.uid() = created_by);

-- Allow users to delete their own data
CREATE POLICY "Allow individual delete" ON public.marketing_leads FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Allow individual delete" ON public.marketing_contacts FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Allow individual delete" ON public.marketing_touchpoints FOR DELETE USING (auth.uid() = created_by);

-- Grant usage to roles
GRANT ALL ON TABLE public.marketing_leads TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.marketing_contacts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.marketing_touchpoints TO anon, authenticated, service_role;

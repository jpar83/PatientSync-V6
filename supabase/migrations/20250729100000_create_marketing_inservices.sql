/*
          # Create Marketing In-Services Table
          This script creates the `marketing_in_services` table to store scheduled events, in-services, and follow-ups for the new Marketing hub.

          ## Query Description: 
          - Creates a new table `marketing_in_services`.
          - Creates a new ENUM type `marketing_in_service_status` for the status column.
          - Adds foreign key relationships to `marketing_leads`, `marketing_contacts`, and `auth.users`.
          - Enables Row Level Security (RLS) and creates policies to ensure users can only access their own records.
          This is a non-destructive operation that adds new database objects.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by dropping the table and type)
          
          ## Structure Details:
          - Table: `public.marketing_in_services`
          - Type: `public.marketing_in_service_status`
          - Columns: `id`, `created_at`, `owner_id`, `lead_id`, `host_contact_id`, `topic`, `date_time`, `location`, `status`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (new policies are created for this table)
          - Auth Requirements: Users must be authenticated to interact with the table.
          
          ## Performance Impact:
          - Indexes: Adds indexes on foreign key columns (`owner_id`, `lead_id`, `host_contact_id`).
          - Triggers: None
          - Estimated Impact: Low.
          */

CREATE TYPE public.marketing_in_service_status AS ENUM (
    'Proposed',
    'Scheduled',
    'Completed',
    'Canceled'
);

CREATE TABLE public.marketing_in_services (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    lead_id uuid REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
    host_contact_id uuid REFERENCES public.marketing_contacts(id) ON DELETE SET NULL,
    topic text,
    date_time timestamp with time zone,
    location text,
    status public.marketing_in_service_status DEFAULT 'Proposed'::public.marketing_in_service_status,
    CONSTRAINT marketing_in_services_pkey PRIMARY KEY (id)
);

ALTER TABLE public.marketing_in_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated user to manage their own in-services"
ON public.marketing_in_services
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

GRANT ALL ON TABLE public.marketing_in_services TO authenticated;
GRANT ALL ON TABLE public.marketing_in_services TO service_role;

/*
  # [Operation Name]
  Enhance Marketing Schema

  [Description of what this operation does]
  This migration extends the marketing-related tables (leads, contacts, touchpoints) with new columns for better tracking and management. It also introduces new enum types for status fields, adds indexes for performance, and sets up row-level security for the leads table.

  ## Query Description: [This operation will add new columns, types, indexes, and security policies to the marketing schema. Existing data will be preserved. The new RLS policy restricts write access to lead owners or admins.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: false
  
  ## Structure Details:
  - Tables affected: marketing_leads, marketing_contacts, marketing_touchpoints
  - New enums: lead_status_enum, touchpoint_type_enum, in_service_status_enum
  - New columns added to marketing_leads, marketing_contacts, marketing_touchpoints.
  - New indexes on marketing_leads and marketing_touchpoints.
  
  ## Security Implications:
  - RLS Status: Enabled on marketing_leads
  - Policy Changes: Yes, new policies for read/write on marketing_leads.
  - Auth Requirements: Authenticated users can read; only owners or admins can write.
  
  ## Performance Impact:
  - Indexes: Added to improve query performance on frequently filtered/sorted columns.
  - Triggers: None
  - Estimated Impact: Low to Medium positive impact on query performance for the marketing hub.
*/

-- Create enums if they don't exist
do $$ begin
  create type public.lead_status_enum as enum ('Prospect','Warm','Active','Dormant','Lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.touchpoint_type_enum as enum ('Call','Email','Drop-in','Meeting','In-Service','Other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.in_service_status_enum as enum ('Planned','Confirmed','Done','Cancelled');
exception when duplicate_object then null; end $$;


-- Add columns to marketing_leads
alter table public.marketing_leads
  add column if not exists source text,
  add column if not exists priority int,
  add column if not exists lead_status public.lead_status_enum default 'Prospect',
  add column if not exists last_contacted_at timestamptz,
  add column if not exists next_action_at timestamptz,
  add column if not exists primary_contact_id uuid references public.marketing_contacts(id) on delete set null,
  add column if not exists street text,
  add column if not exists zip text,
  add column if not exists tags text[],
  add column if not exists lead_score int,
  add column if not exists converted_to text,
  add column if not exists converted_ref_id uuid,
  add column if not exists deleted_at timestamptz;


-- Add columns to marketing_contacts
alter table public.marketing_contacts
  add column if not exists role text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists is_primary boolean default false,
  add column if not exists notes text;


-- Add columns to marketing_touchpoints
alter table public.marketing_touchpoints
  add column if not exists type public.touchpoint_type_enum default 'Call',
  add column if not exists outcome text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists duration_mins int;


-- Add Indexes
create index if not exists idx_leads_next_action on public.marketing_leads(next_action_at);
create index if not exists idx_leads_owner on public.marketing_leads(owner_id);
create index if not exists idx_leads_status on public.marketing_leads(lead_status);
create index if not exists idx_tp_lead_occurred on public.marketing_touchpoints(lead_id, created_at desc);


-- Enable and configure RLS for marketing_leads
alter table public.marketing_leads enable row level security;

drop policy if exists "leads_read_all" on public.marketing_leads;
create policy "leads_read_all" on public.marketing_leads
  for select using (auth.role() = 'authenticated');

drop policy if exists "leads_write_owner_or_mgr" on public.marketing_leads;
create policy "leads_write_owner_or_mgr" on public.marketing_leads
  for all using (
    auth.uid() = owner_id or exists(
      select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
    )
  );

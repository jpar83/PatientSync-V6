/*
  # [Structural] Fix Marketing Tables
  This migration adds the missing `occurred_at` column to `marketing_touchpoints` and ensures `marketing_in_services` has appropriate RLS policies.

  ## Query Description: 
  - Adds `occurred_at` to `marketing_touchpoints` to fix a bug where journal entries could not be saved.
  - Adds RLS policies to `marketing_in_services` to ensure users can manage their own in-service events.
  This is a non-destructive operation.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: `public.marketing_touchpoints`
    - Column Added: `occurred_at` (timestamptz)
  - Table: `public.marketing_in_services`
    - RLS Enabled
    - Policies Added: `inservices_read_all`, `inservices_write_owner_or_mgr`
  
  ## Security Implications:
  - RLS Status: Enabled on `marketing_in_services`
  - Policy Changes: Yes
  - Auth Requirements: None
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Low
*/

-- Add missing occurred_at column to touchpoints
alter table public.marketing_touchpoints
  add column if not exists occurred_at timestamptz not null default now();

-- Add RLS to in_services table for security
alter table public.marketing_in_services enable row level security;

-- Allow all authenticated users to read in-services
do $$ begin
  create policy "inservices_read_all" on public.marketing_in_services
    for select using (auth.role() is not null);
exception when duplicate_object then null; end $$;

-- Allow users to manage their own in-services, and admins/managers to manage all
do $$ begin
  create policy "inservices_write_owner_or_mgr" on public.marketing_in_services
    for all using (
      auth.uid() = user_id or exists(
        select 1 from public.profiles p
         where p.id = auth.uid() and p.role in ('admin','manager')
      )
    );
exception when duplicate_object then null; end $$;

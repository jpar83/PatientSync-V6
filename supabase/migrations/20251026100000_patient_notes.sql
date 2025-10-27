/*
          # Create patient_notes table
          This migration creates a new table to store notes related to patients, separate from the audit log.

          ## Query Description: This script creates the `patient_notes` table, adds indexes for performance, sets up an RLS policy for security, and creates a trigger to automatically update the `updated_at` timestamp. This is a structural change and is non-destructive.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: `patient_notes`
          - Columns: `id`, `patient_id`, `body`, `source`, `stage_from`, `stage_to`, `is_pinned`, `tags`, `created_by`, `created_at`, `updated_at`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes, creates read, insert, update, and delete policies for authenticated users.
          - Auth Requirements: Authenticated user
          
          ## Performance Impact:
          - Indexes: Added on `(patient_id, created_at)` and a GIN index on `tags`.
          - Triggers: Added `moddatetime` trigger for `updated_at`.
          - Estimated Impact: Low, improves query performance for fetching notes.
          */
-- Enable the moddatetime extension if it does not exist
create extension if not exists moddatetime with schema extensions;

-- Create the patient_notes table
create table if not exists public.patient_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  body text not null,
  source text not null default 'manual' check (source in ('manual','stage_change')),
  stage_from text null,
  stage_to text null,
  is_pinned boolean not null default false,
  tags text[] not null default '{}',
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes
create index if not exists idx_patient_notes_patient on public.patient_notes(patient_id, created_at desc);
create index if not exists idx_patient_notes_tags on public.patient_notes using gin(tags);

-- Add trigger for updated_at
drop trigger if exists set_updated_at on public.patient_notes;
create trigger set_updated_at
before update on public.patient_notes
for each row
execute procedure extensions.moddatetime(updated_at);

-- Enable RLS and define policies
alter table public.patient_notes enable row level security;

drop policy if exists "notes_read" on public.patient_notes;
create policy "notes_read" on public.patient_notes
for select using (auth.uid() is not null);

drop policy if exists "notes_insert" on public.patient_notes;
create policy "notes_insert" on public.patient_notes
for insert with check (auth.uid() = created_by);

drop policy if exists "notes_update" on public.patient_notes;
create policy "notes_update" on public.patient_notes
for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "notes_delete" on public.patient_notes;
create policy "notes_delete" on public.patient_notes
for delete using (auth.uid() = created_by);

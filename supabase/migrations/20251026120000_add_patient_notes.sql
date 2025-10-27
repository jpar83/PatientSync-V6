/*
  # [FEATURE] Patient Notes System (Corrected)

  This migration sets up the foundational table for a persistent notes system.
  This script includes a fix for the `moddatetime` extension which was missing in a previous version.

  ## Query Description:
  - **Creates Extension:** Enables the `moddatetime` extension required for automatically updating `updated_at` timestamps.
  - **Creates Table:** Introduces `public.patient_notes` to store note content, metadata (source, pinning status, tags), and user/patient associations.
  - **Adds Indexes:** Optimizes queries for fetching notes by patient and searching by tags.
  - **Adds Trigger:** Automates the update of the `updated_at` field on any row modification.
  - **Enables RLS:** Secures the table with Row Level Security, ensuring users can only access and manage their own notes or notes they are permitted to see.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (with a down migration)

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes, adds read, insert, update, and delete policies for `patient_notes`.
  - Auth Requirements: All operations require an authenticated user. Update/delete operations are restricted to the note's creator.
*/

-- 1. Enable moddatetime extension
create extension if not exists moddatetime with schema extensions;

-- 2. Create the patient_notes table
create table public.patient_notes (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    body text not null check (length(body) > 0),
    source text not null default 'manual' check (source in ('manual', 'stage_change')),
    stage_from text null,
    stage_to text null,
    is_pinned boolean not null default false,
    tags text[] not null default '{}',
    created_by uuid not null default auth.uid() references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
comment on table public.patient_notes is 'Stores notes related to patients, including manual entries and automated logs from stage changes.';

-- 3. Add Indexes
create index idx_patient_notes_patient_id on public.patient_notes(patient_id, created_at desc);
create index idx_patient_notes_tags on public.patient_notes using gin(tags);

-- 4. Add updated_at trigger
create trigger set_updated_at
before update on public.patient_notes
for each row
execute procedure extensions.moddatetime(updated_at);

-- 5. Enable RLS and define policies
alter table public.patient_notes enable row level security;

create policy "Users can read all notes"
on public.patient_notes for select
using ( auth.uid() is not null );

create policy "Users can insert their own notes"
on public.patient_notes for insert
with check ( auth.uid() = created_by );

create policy "Users can update their own notes"
on public.patient_notes for update
using ( auth.uid() = created_by )
with check ( auth.uid() = created_by );

create policy "Users can delete their own notes"
on public.patient_notes for delete
using ( auth.uid() = created_by );

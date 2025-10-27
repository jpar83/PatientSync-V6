/*
          # Create export_all_notes function
          This migration creates a new function to export all notes with patient and author details.

          ## Query Description: This script creates a new SQL function `export_all_notes` that joins `patient_notes`, `patients`, and `profiles` to return a comprehensive view of all notes for CSV export. This is a read-only function and is non-destructive.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function: `export_all_notes`
          
          ## Security Implications:
          - RLS Status: Not applicable to function directly, but it queries RLS-protected tables. The function is defined with `SECURITY INVOKER` to respect the calling user's permissions.
          - Policy Changes: No
          - Auth Requirements: Authenticated user
          
          ## Performance Impact:
          - Indexes: The function will benefit from existing indexes on the queried tables.
          - Triggers: None
          - Estimated Impact: Low, query performance depends on the number of notes.
          */
create or replace function public.export_all_notes()
returns table (
    created_at timestamptz,
    patient_name text,
    patient_id uuid,
    body text,
    source text,
    stage_from text,
    stage_to text,
    created_by text
)
language sql
security invoker
as $$
  select
    n.created_at,
    p.name as patient_name,
    n.patient_id,
    n.body,
    n.source,
    n.stage_from,
    n.stage_to,
    u.full_name as created_by
  from public.patient_notes n
  join public.patients p on n.patient_id = p.id
  left join public.profiles u on n.created_by = u.id
  order by n.created_at desc;
$$;

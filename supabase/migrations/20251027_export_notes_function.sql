/*
  # [Function] export_all_notes
  Creates a function to export all patient notes with associated patient and user data for CSV download.

  ## Query Description: 
  This function joins `patient_notes` with `patients` and `auth.users` to provide a comprehensive, read-only export. It poses no risk to existing data.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the function can be dropped)

  ## Structure Details:
  - Function: `export_all_notes()`
  - Returns: table(created_at, patient_name, patient_id, body, source, stage_from, stage_to, created_by)

  ## Security Implications:
  - RLS Status: This function is defined with `SECURITY DEFINER` to allow an authorized user to export all records, bypassing RLS for this specific reporting purpose.
  - Policy Changes: No
  - Auth Requirements: Authenticated role

  ## Performance Impact:
  - Indexes: Utilizes existing indexes on `patient_notes` and `patients`.
  - Triggers: None
  - Estimated Impact: Low. Performance depends on the size of the notes table.
*/
create or replace function export_all_notes()
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
security definer
set search_path = public
as $$
  select
    pn.created_at,
    p.name as patient_name,
    pn.patient_id,
    pn.body,
    pn.source,
    pn.stage_from,
    pn.stage_to,
    coalesce(prof.full_name, u.email) as created_by
  from patient_notes as pn
  left join patients as p on pn.patient_id = p.id
  left join auth.users as u on pn.created_by = u.id
  left join profiles as prof on pn.created_by = prof.id
  order by pn.created_at desc;
$$;

grant execute on function export_all_notes() to authenticated;

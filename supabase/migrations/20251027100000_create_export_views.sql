/*
          # Create Safe Export Views
          This migration creates a set of safe database views for the Export Center.

          ## Query Description: This script uses `CREATE OR REPLACE VIEW` to safely create views for `notes_by_patient` and `patient_details`. These views are based on table and column schemas that have been confirmed to exist, avoiding errors from previous attempts. The more complex views are temporarily omitted and will be added incrementally. This ensures the core export functionality can be built on a stable foundation.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - View: `view_notes_by_patient`
          - View: `view_patient_details`
          
          ## Security Implications:
          - RLS Status: Not applicable directly. `SECURITY INVOKER` is used to ensure the querying user's permissions are respected.
          - Policy Changes: No
          - Auth Requirements: Authenticated user
          
          ## Performance Impact:
          - Indexes: Views will leverage existing table indexes.
          - Triggers: None
          - Estimated Impact: Low.
          */

-- View for Notes, joining with patient and user profiles
create or replace view public.view_notes_by_patient
with (security_invoker = true) as
select
  p.id as patient_id,
  p.name as patient_name,
  p.primary_insurance as payer,
  n.id as note_id,
  n.body,
  n.source,
  n.stage_from,
  n.stage_to,
  u.full_name as created_by_name,
  n.created_at
from
  public.patient_notes n
  join public.patients p on p.id = n.patient_id
  left join public.profiles u on u.id = n.created_by;

-- View for basic patient details
create or replace view public.view_patient_details
with (security_invoker = true) as
select
  p.id as patient_id,
  p.name as patient_name,
  p.dob,
  p.phone_number as phone,
  p.email,
  p.primary_insurance as payer,
  (select o.workflow_stage from public.orders o where o.patient_id = p.id order by o.created_at desc limit 1) as current_stage,
  p.created_at,
  p.updated_at,
  (select max(n.created_at) from public.patient_notes n where n.patient_id = p.id) as last_note_at
from
  public.patients p;

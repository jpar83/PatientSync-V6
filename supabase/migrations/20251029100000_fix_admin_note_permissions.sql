/*
          # [Operation Name]
          Fix Admin Note Permissions

          ## Query Description: [This operation updates the security policies for the `patient_notes` table to correctly allow administrators to edit or delete any note. It replaces the previous, more complex policies with simpler, more robust versions that directly check if the current user has the 'admin' role.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Affects policies on the `patient_notes` table.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Admin role]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Negligible performance impact.]
          */

-- Drop the old policies if they exist
drop policy if exists "notes_update" on "public"."patient_notes";
drop policy if exists "notes_delete" on "public"."patient_notes";

-- Create a helper function to check if the current user is an admin.
-- This is more efficient and reliable than using a subquery in every policy.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select (select role from profiles where id = auth.uid()) = 'admin';
$$;

-- Recreate the update policy using the new helper function.
-- Allows updates if the user is the creator OR is an admin.
create policy "notes_update" on "public"."patient_notes"
  for update using ((auth.uid() = created_by) or (is_admin()))
  with check ((auth.uid() = created_by) or (is_admin()));

-- Recreate the delete policy using the new helper function.
-- Allows deletes if the user is the creator OR is an admin.
create policy "notes_delete" on "public"."patient_notes"
  for delete using ((auth.uid() = created_by) or (is_admin()));

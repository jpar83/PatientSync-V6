/*
  # [SECURITY] Update Patient Note RLS Policies

  This migration updates the Row Level Security (RLS) policies for the `patient_notes` table to allow administrators to edit or delete any note. Previously, only the original author of a note could modify it.

  ## Query Description:
  - **DROP POLICY**: The existing `notes_update` and `notes_delete` policies are removed to be replaced.
  - **CREATE POLICY**: New policies are created with updated rules. The new rules grant access if the current user's ID matches the note's `created_by` field OR if the user has the 'admin' role in the `profiles` table.
  - This change ensures that admins have full moderation control over notes while regular users retain control only over their own content.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by restoring the original, more restrictive policies)

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes. The `notes_update` and `notes_delete` policies are made less restrictive for admin users. This is an intentional change to grant administrative privileges.
  - Auth Requirements: Requires authenticated user. Admin role is checked via the `profiles` table.
*/

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "notes_update" ON public.patient_notes;
DROP POLICY IF EXISTS "notes_delete" ON public.patient_notes;

-- Recreate the UPDATE policy to allow owners and admins to update
CREATE POLICY "notes_update" ON public.patient_notes
FOR UPDATE
USING (
  (auth.uid() = created_by) OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
)
WITH CHECK (
  (auth.uid() = created_by) OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

-- Recreate the DELETE policy to allow owners and admins to delete
CREATE POLICY "notes_delete" ON public.patient_notes
FOR DELETE
USING (
  (auth.uid() = created_by) OR
  ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

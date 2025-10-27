/*
          # [Operation Name]
          Update Note Permissions for Admins

          ## Query Description: [This migration updates the Row Level Security (RLS) policies for the `patient_notes` table to grant admin users full edit and delete privileges on all notes. Standard users will retain the ability to modify only their own notes. This change is necessary for administrative oversight and content management.

There is no risk of data loss with this operation, as it only modifies permissions.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tables affected: `patient_notes`
          - Policies modified: `notes_update`, `notes_delete`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This policy grants elevated privileges to users with the 'admin' role in the `profiles` table.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. The policy check includes a subquery, but it is scoped to a single user and should be very fast.
          */

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "notes_update" ON "public"."patient_notes";
DROP POLICY IF EXISTS "notes_delete" ON "public"."patient_notes";

-- Create a new UPDATE policy that allows updates by the creator OR an admin.
CREATE POLICY "notes_update" ON "public"."patient_notes"
FOR UPDATE
USING (
  (auth.uid() = created_by) OR
  ((SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'::text)
)
WITH CHECK (
  (auth.uid() = created_by) OR
  ((SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'::text)
);

-- Create a new DELETE policy that allows deletion by the creator OR an admin.
CREATE POLICY "notes_delete" ON "public"."patient_notes"
FOR DELETE
USING (
  (auth.uid() = created_by) OR
  ((SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'::text)
);

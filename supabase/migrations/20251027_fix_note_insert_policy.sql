/*
  # [Fix] Correct RLS policy for patient_notes insertion

  ## Query Description: 
  This script creates the missing insert policy on the `public.patient_notes` table. A typo in a previous migration prevented this policy from being created, which is why adding new notes is failing. This change is safe and necessary for the notes feature to function correctly.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Creates policy `notes_insert` on table `public.patient_notes`.

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes
  - Auth Requirements: Adds the missing policy to correctly use `auth.uid()`.
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/

-- Drop the policy just in case it exists in a faulty state.
DROP POLICY IF EXISTS "notes_insert" ON public.patient_notes;

-- Create the insert policy correctly on the patient_notes table.
CREATE POLICY "notes_insert" 
ON public.patient_notes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

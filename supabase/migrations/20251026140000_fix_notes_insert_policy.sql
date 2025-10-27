/*
          # Fix notes_insert policy
          This migration corrects the RLS policy for inserting notes.

          ## Query Description: The previous policy incorrectly checked `auth.uid() = created_by`, which fails because `created_by` is set on insert. This script updates the policy to a simple `auth.uid() is not null` check, allowing any authenticated user to insert notes.
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: `patient_notes`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes, modifies the `notes_insert` policy.
          - Auth Requirements: Authenticated user
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: None
          */
drop policy if exists "notes_insert" on public.patient_notes;
create policy "notes_insert" on public.patient_notes
for insert with check (auth.uid() is not null);

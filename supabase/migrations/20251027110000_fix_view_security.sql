/*
          # Fix View Security
          This migration corrects a critical security vulnerability in the database views.

          ## Query Description: The previous migration created views with `SECURITY DEFINER`, which could bypass Row Level Security (RLS) policies. This script alters the views to use `SECURITY INVOKER`, ensuring that all queries against these views respect the permissions of the user making the request. This is a critical security fix.
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - View: `view_notes_by_patient`
          - View: `view_patient_details`
          
          ## Security Implications:
          - RLS Status: Enforces RLS by changing view security model from DEFINER to INVOKER.
          - Policy Changes: No direct policy changes, but makes existing policies effective on views.
          - Auth Requirements: Authenticated user
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible.
          */

alter view public.view_notes_by_patient set (security_invoker = true);
alter view public.view_patient_details set (security_invoker = true);

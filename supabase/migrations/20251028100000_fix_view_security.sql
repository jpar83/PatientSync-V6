/*
          # [Operation Name]
          Fix View Security

          ## Query Description: [This migration corrects a critical security vulnerability in the database views created for the Export Center. It changes the views from `SECURITY DEFINER` to `SECURITY INVOKER`, ensuring that all data access through these views correctly enforces the Row Level Security (RLS) policies of the user making the request. This prevents any potential data leaks.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Alters `view_notes_by_patient`
          - Alters `view_patient_details`
          
          ## Security Implications:
          - RLS Status: [Enforced]
          - Policy Changes: [No]
          - Auth Requirements: [Applies to all authenticated users]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */
ALTER VIEW public.view_notes_by_patient SET (security_invoker = true);
ALTER VIEW public.view_patient_details SET (security_invoker = true);

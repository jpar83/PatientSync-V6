/*
  # [SECURITY] Harden Function Security
  [This migration secures existing database functions by explicitly setting their search_path. This prevents potential hijacking attacks by ensuring functions only search within the intended schemas.]

  ## Query Description: [This operation modifies the configuration of existing database functions to improve security. It does not alter the function's logic or impact any data. It is a safe and recommended change.]
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Functions affected: find_patient_duplicates, merge_patients
  
  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [Admin privileges to alter functions]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [None. This is a security configuration change with no performance overhead.]
*/

ALTER FUNCTION public.find_patient_duplicates()
SET search_path = public;

ALTER FUNCTION public.merge_patients(ids uuid[])
SET search_path = public;

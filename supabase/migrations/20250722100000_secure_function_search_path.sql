/*
# [SECURITY] Harden Function Search Paths
This migration secures all custom functions by explicitly setting the `search_path`. This mitigates the risk of search path hijacking attacks, addressing the "Function Search Path Mutable" security advisory.

## Query Description:
This operation alters existing functions to restrict their search path to `public` and `extensions`. It is a non-destructive security enhancement and does not affect function logic or data.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by altering the function to reset the search_path)

## Structure Details:
- Altering function: `global_search`
- Altering function: `compare_patient_records_batch`
- Altering function: `find_patient_duplicates`
- Altering function: `merge_patients`
- Altering function: `get_intake_dashboard_stats`

## Security Implications:
- RLS Status: Not changed
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Search path hijacking vulnerabilities.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

-- Secure global_search function
ALTER FUNCTION public.global_search(p_search_term text)
SET search_path = public, extensions;

-- Secure compare_patient_records_batch function
ALTER FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
SET search_path = public, extensions;

-- Secure find_patient_duplicates function
ALTER FUNCTION public.find_patient_duplicates()
SET search_path = public, extensions;

-- Secure merge_patients function
ALTER FUNCTION public.merge_patients(ids uuid[])
SET search_path = public, extensions;

-- Secure get_intake_dashboard_stats function
ALTER FUNCTION public.get_intake_dashboard_stats()
SET search_path = public, extensions;

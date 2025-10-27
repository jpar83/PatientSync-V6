/*
# [SECURITY] Secure Function Search Path
This migration secures the `compare_patient_records_batch` and `global_search` functions by explicitly setting their `search_path`. This mitigates a security vulnerability where a malicious user could potentially create objects in other schemas to hijack function execution.

## Query Description:
- This operation alters two existing functions to make them more secure.
- It does not modify any table data and is considered a safe, non-destructive change.
- The functions will behave identically after the change, but with an added layer of security.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by altering the function again to reset the search_path)

## Structure Details:
- Function: `public.compare_patient_records_batch(jsonb)`
- Function: `public.global_search(text)`

## Security Implications:
- RLS Status: Not Applicable
- Policy Changes: No
- Auth Requirements: None
- Fixes Advisory: "Function Search Path Mutable"

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

-- Set a secure search_path for the batch comparison function.
ALTER FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
SET search_path = public;

-- Set a secure search_path for the global search function, which is SECURITY DEFINER.
-- This is critical to prevent privilege escalation.
ALTER FUNCTION public.global_search(p_search_term text)
SET search_path = public;

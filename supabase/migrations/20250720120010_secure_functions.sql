/*
# [SECURITY] Harden Database Functions

This migration enhances security by setting a fixed, secure `search_path` for existing database functions.

## Query Description:
This operation mitigates the risk of "search path hijacking" by explicitly defining which schemas a function can search. It prevents a malicious user from creating objects in other schemas (e.g., `public`) that could be executed with the function's elevated privileges. This is a non-destructive, safe operation that improves security posture.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies `global_search(text)`
- Modifies `compare_patient_records_batch(jsonb)`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: `[WARN] Function Search Path Mutable` advisory.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. May slightly improve function execution speed by reducing schema search overhead.
*/

-- Secure the global search function
ALTER FUNCTION public.global_search(p_search_term text)
SET search_path = public, pg_catalog;

-- Secure the patient record comparison function
ALTER FUNCTION public.compare_patient_records_batch(new_data_batch jsonb)
SET search_path = public, pg_catalog;

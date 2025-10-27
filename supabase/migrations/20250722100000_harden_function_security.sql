/*
# [Function Security Hardening]
This migration hardens the security of existing database functions by setting a secure `search_path`. This addresses the "Function Search Path Mutable" security advisory by preventing potential hijacking of function execution by malicious actors who might create objects in other schemas.

## Query Description:
This operation alters the configuration of two functions: `global_search` and `compare_patient_records_batch`. It does not modify the logic or data. It is a safe, non-destructive operation.

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (by altering the function again to remove the setting)

## Structure Details:
- Functions affected:
  - public.global_search(p_search_term text)
  - public.compare_patient_records_batch(new_data_batch jsonb)

## Security Implications:
- RLS Status: Not applicable
- Policy Changes: No
- Auth Requirements: Admin privileges to alter functions.
- Mitigates: `search_path` manipulation vulnerabilities.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a configuration change.
*/

ALTER FUNCTION public.global_search(p_search_term text) SET search_path = 'public';

ALTER FUNCTION public.compare_patient_records_batch(new_data_batch jsonb) SET search_path = 'public';

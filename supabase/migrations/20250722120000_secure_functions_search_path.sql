/*
  # [Security Hardening] Set Function Search Path
  This migration hardens the security of database functions by explicitly setting the `search_path`.
  This mitigates the risk of search path hijacking attacks (CVE-2018-1058), addressing the 'Function Search Path Mutable' security advisory.

  ## Query Description:
  - This operation alters two existing functions: `global_search` and `compare_patient_records_batch`.
  - It sets their `search_path` to `pg_catalog, public`, ensuring they only search in trusted schemas.
  - This is a non-destructive, safe operation that improves security without affecting function behavior.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by altering the function to reset the search_path)

  ## Structure Details:
  - Functions affected:
    - public.global_search(text)
    - public.compare_patient_records_batch(jsonb)

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None
  - Mitigates: CVE-2018-1058 (Search Path Hijacking)

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. May provide a minor performance improvement by limiting schema searching.
*/

-- Secure the global_search function by setting a safe search path.
ALTER FUNCTION public.global_search(text) SET search_path = pg_catalog, public;

-- Secure the batch patient record comparison function by setting a safe search path.
ALTER FUNCTION public.compare_patient_records_batch(jsonb) SET search_path = pg_catalog, public;

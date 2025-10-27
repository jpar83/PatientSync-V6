/*
  # [Function Security] Harden bulk_update_order_docs
  [This operation sets a fixed, safe search_path for the bulk_update_order_docs function to prevent potential hijacking attacks.]
  ## Query Description: [Sets the function's search path to 'public'. This is a safe, non-destructive security enhancement that ensures the function calls objects only from the intended schema, mitigating risks of malicious code execution through path manipulation.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function: public.bulk_update_order_docs(uuid[], text[], text, text)
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: None. This is a security configuration change.
*/
ALTER FUNCTION public.bulk_update_order_docs(order_ids uuid[], doc_keys text[], note text, user_email text) SET search_path = public;

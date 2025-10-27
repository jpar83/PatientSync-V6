/*
  # [Schema] Add Administrative Fields
  [This operation adds new columns to the 'orders' and 'patients' tables to support enhanced administrative tracking, including payer regions, case types, referral sources, and user assignments.]
  ## Query Description: [This is a non-destructive operation that adds new text and UUID columns to existing tables. No data will be lost. It brings the database schema in line with the application's data model.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
  ## Structure Details:
  - Table 'orders': Adds 'payer_region', 'case_type', 'referral_source'
  - Table 'patients': Adds 'assigned_to'
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payer_region TEXT,
ADD COLUMN IF NOT EXISTS case_type TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT;

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);

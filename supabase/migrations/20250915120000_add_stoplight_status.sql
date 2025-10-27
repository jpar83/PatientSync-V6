/*
          # Add Stoplight Status
          Adds a 'stoplight_status' column to the 'patients' and 'orders' tables to track referral health.

          ## Query Description: This operation adds a new column with a default value to two tables. It is a non-destructive, structural change. Existing rows will be assigned the default 'green' status.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Tables affected: public.patients, public.orders
          - Columns added: stoplight_status (TEXT)
          - Constraints added: CHECK constraint to limit values to 'green', 'yellow', 'red'. DEFAULT 'green'.

          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None

          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. The operation may take a moment on very large tables during the initial backfill of default values.
          */

ALTER TABLE public.patients
ADD COLUMN stoplight_status TEXT CHECK (stoplight_status IN ('green', 'yellow', 'red')) DEFAULT 'green';

ALTER TABLE public.orders
ADD COLUMN stoplight_status TEXT CHECK (stoplight_status IN ('green', 'yellow', 'red')) DEFAULT 'green';

COMMENT ON COLUMN public.patients.stoplight_status IS 'Visual indicator for referral health (green, yellow, red).';
COMMENT ON COLUMN public.orders.stoplight_status IS 'Visual indicator for referral health, synced with patient status.';

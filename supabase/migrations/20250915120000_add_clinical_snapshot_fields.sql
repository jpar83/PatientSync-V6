/*
          # [Operation Name]
          Add Clinical and Snapshot Fields

          ## Query Description: [This operation adds several new columns to the `patients` and `orders` tables to support a more comprehensive patient snapshot PDF report. It includes fields for clinical information and an avatar URL. These changes are non-destructive and will not affect existing data.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Adding `diagnosis` (TEXT) to `patients` table.
          - Adding `height` (TEXT) to `patients` table.
          - Adding `weight` (TEXT) to `patients` table.
          - Adding `avatar_url` (TEXT) to `patients` table.
          - Adding `justification` (TEXT) to `orders` table.
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None added
          - Triggers: None added
          - Estimated Impact: Negligible performance impact on existing queries.
          */

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS justification TEXT;

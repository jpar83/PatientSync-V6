/*
  # [Schema Fix] Add Missing Columns to Equipment Table
  [This operation adds the 'model', 'is_returned', 'date_returned', 'is_repaired', and 'date_repaired' columns to the 'equipment' table to align the database schema with the application's data model and prevent "column not found" errors.]
  ## Query Description: [This is a non-destructive ALTER TABLE operation. It adds new, nullable columns to the equipment table. Existing data will not be affected. This change is required for the equipment tracking feature to function correctly.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
  ## Structure Details:
  - Table: public.equipment
  - Columns Added: model (TEXT), is_returned (BOOLEAN), date_returned (DATE), is_repaired (BOOLEAN), date_repaired (DATE)
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: Negligible. Adding nullable columns is a fast metadata change.
*/
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS is_returned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS date_returned DATE,
ADD COLUMN IF NOT EXISTS is_repaired BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS date_repaired DATE;

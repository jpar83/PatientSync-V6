/*
  # [Feature] Add Clinical Fields for PDF Snapshot
  [This migration adds columns to the `patients` and `orders` tables to support the comprehensive Patient Snapshot PDF export. It includes fields for clinical data like diagnosis, height, weight, and justification.]

  ## Query Description: [This operation adds new columns to existing tables. It is non-destructive and should not impact existing data. The new columns will be `NULL` for existing rows until populated.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the columns)
  
  ## Structure Details:
  - Table 'patients': Adds 'diagnosis' (TEXT), 'height' (TEXT), 'weight' (TEXT), 'avatar_url' (TEXT).
  - Table 'orders': Adds 'justification' (TEXT).
  
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible performance impact.
*/

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS justification TEXT;

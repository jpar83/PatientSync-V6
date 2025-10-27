/*
          # [Operation Name]
          Add Clinical Fields for PDF Snapshots

          ## Query Description: [This operation adds new, non-essential text fields to the `patients` table to store clinical information like diagnosis, height, and weight for reporting purposes. It is a non-destructive, structural change that will not impact existing data.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table `public.patients`:
            - Adds column `diagnosis` (TEXT)
            - Adds column `height` (TEXT)
            - Adds column `weight` (TEXT)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None added
          - Triggers: None added
          - Estimated Impact: Negligible performance impact on existing queries.
          */

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS weight TEXT;

/*
          # [Operation Name]
          Add 'next_step' column to marketing_touchpoints table

          ## Query Description: [This operation adds a new 'next_step' text column to the 'marketing_touchpoints' table. This is a non-destructive change that is required to fix a bug where the application was trying to save data to a column that did not exist. It will not affect any existing data.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: marketing_touchpoints
          - Column Added: next_step (TEXT)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible.
          */

ALTER TABLE public.marketing_touchpoints
ADD COLUMN next_step TEXT;

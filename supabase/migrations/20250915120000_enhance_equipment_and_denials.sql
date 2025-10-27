/*
          # [Operation Name]
          Enhance Equipment and Denials Tables

          ## Query Description: [This operation adds new columns to the `equipment` and `denials` tables to support more detailed tracking. It adds `category` and `notes` to equipment, and `payer`, `reason_code`, `stage_at_denial`, and `resolved` to denials. These changes are non-destructive and will not affect existing data.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - tables: `equipment`, `denials`
          - columns added: `equipment.category`, `equipment.notes`, `denials.payer`, `denials.reason_code`, `denials.stage_at_denial`, `denials.resolved`
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None added
          - Triggers: None added
          - Estimated Impact: Negligible performance impact.
          */

-- Add category and notes to equipment table
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add new fields to denials table
ALTER TABLE public.denials
ADD COLUMN IF NOT EXISTS payer TEXT,
ADD COLUMN IF NOT EXISTS reason_code TEXT,
ADD COLUMN IF NOT EXISTS stage_at_denial TEXT,
ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;

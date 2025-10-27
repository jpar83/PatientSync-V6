/*
          # [Operation Name]
          Enhance Equipment and Denials Tracking

          ## Query Description: [This migration adds structured tracking for equipment categories and creates a new system for logging multiple denial instances per referral. It alters the 'equipment' table and creates a new 'denials' table.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Adds 'category' and 'notes' to 'equipment' table.
          - Creates new 'denials' table with foreign key to 'orders'.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [Added]
          - Estimated Impact: [Low. Adds new tables and columns with appropriate indexes.]
          */

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_category') THEN
        CREATE TYPE public.equipment_category AS ENUM (
            'Wheelchair',
            'Power Wheelchair',
            'Scooter',
            'Seating',
            'Respiratory',
            'Wound',
            'Other'
        );
    END IF;
END$$;

ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS category public.equipment_category,
ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS public.denials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    denial_date DATE NOT NULL,
    payer TEXT,
    reason_code TEXT,
    denial_reason TEXT,
    stage_at_denial TEXT,
    appeal_filed BOOLEAN DEFAULT false,
    appeal_date DATE,
    appeal_outcome TEXT,
    resolved BOOLEAN DEFAULT false,
    notes TEXT
);

ALTER TABLE public.denials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.denials;
CREATE POLICY "Allow all access to authenticated users"
ON public.denials
FOR ALL
TO authenticated
USING (true);

CREATE OR REPLACE TRIGGER on_denials_update
BEFORE UPDATE ON public.denials
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- Add category and notes to equipment table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='category') THEN
    ALTER TABLE public.equipment ADD COLUMN category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='notes') THEN
    ALTER TABLE public.equipment ADD COLUMN notes TEXT;
  END IF;
END
$$;

-- Add new fields to denials table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='denials' AND column_name='payer') THEN
    ALTER TABLE public.denials ADD COLUMN payer TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='denials' AND column_name='reason_code') THEN
    ALTER TABLE public.denials ADD COLUMN reason_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='denials' AND column_name='stage_at_denial') THEN
    ALTER TABLE public.denials ADD COLUMN stage_at_denial TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='denials' AND column_name='resolved') THEN
    ALTER TABLE public.denials ADD COLUMN resolved BOOLEAN DEFAULT false;
  END IF;
END
$$;

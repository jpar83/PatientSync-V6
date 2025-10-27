ALTER TABLE public.marketing_touchpoints
    ADD COLUMN IF NOT EXISTS next_step text;

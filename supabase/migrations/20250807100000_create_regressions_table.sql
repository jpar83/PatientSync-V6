/*
  # [Feature] Create Regressions Table
  [This operation creates a new table `public.regressions` to explicitly track instances where a referral moves backward in the workflow, enabling structured reason-based reporting.]
  ## Query Description: [This is a non-destructive operation that adds a new table and its security policies. It does not affect any existing data and is crucial for the new regression tracking feature.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Table: public.regressions
  - Columns: id, created_at, order_id, from_stage, to_stage, reason, notes, resolved, resolved_at, user_id
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (New policies for the `regressions` table)
  - Auth Requirements: Authenticated users
  ## Performance Impact:
  - Indexes: Primary key index on `id`.
  - Triggers: None
  - Estimated Impact: Low. Adds a new table for logging.
*/
CREATE TABLE public.regressions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    order_id uuid NOT NULL,
    from_stage text NOT NULL,
    to_stage text NOT NULL,
    reason text NOT NULL,
    notes text NOT NULL,
    resolved boolean NOT NULL DEFAULT false,
    resolved_at timestamp with time zone,
    user_id uuid REFERENCES auth.users(id),
    CONSTRAINT regressions_pkey PRIMARY KEY (id),
    CONSTRAINT regressions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.regressions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to view their own data"
ON public.regressions
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert their own data"
ON public.regressions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own regression records"
ON public.regressions
FOR UPDATE
USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.regressions IS 'Tracks instances where a referral moves backward in the workflow.';
COMMENT ON COLUMN public.regressions.reason IS 'Structured reason for the regression, from a predefined list.';
COMMENT ON COLUMN public.regressions.resolved IS 'Indicates if the issue causing the regression has been addressed.';

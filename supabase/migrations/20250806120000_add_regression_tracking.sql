/*
  # [Feature] Add Regression Tracking System
  [This operation creates a new 'regressions' table to track when and why a referral moves backward in the workflow. It also updates the main dashboard metrics function to use this new, more accurate data.]
  ## Query Description: [This is a structural enhancement that adds a new table and updates a database function. It is non-destructive and will not impact existing data. No backup is required.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
  ## Structure Details:
  - Table Added: public.regressions
  - Function Modified: public.get_dashboard_metrics()
  ## Security Implications:
  - RLS Status: Enabled on new table.
  - Policy Changes: Yes, new policies for 'regressions' table.
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: Primary key and foreign key indexes added on new table.
  - Triggers: N/A
  - Estimated Impact: Low. The dashboard metrics query may be slightly faster.
*/

-- Create the regressions table to store structured data about workflow regressions.
CREATE TABLE IF NOT EXISTS public.regressions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    order_id uuid NOT NULL,
    previous_stage text NOT NULL,
    new_stage text NOT NULL,
    reason text NOT NULL,
    notes text,
    user_id uuid NULL,
    CONSTRAINT regressions_pkey PRIMARY KEY (id),
    CONSTRAINT regressions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT regressions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security on the new table.
ALTER TABLE public.regressions ENABLE ROW LEVEL SECURITY;

-- Policies for the new regressions table
CREATE POLICY "Allow authenticated user to insert their own regressions"
ON public.regressions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to read regression records"
ON public.regressions
FOR SELECT
TO authenticated
USING (true);

-- Update the dashboard metrics function to use the new, more accurate regressions table.
-- Drop the old one if it exists
DROP FUNCTION IF EXISTS public.get_dashboard_metrics();

-- Create the new, more accurate function
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS TABLE(total_orders bigint, ready_for_par_count bigint, avg_days_in_stage double precision, regressions_7d bigint, total_history_7d bigint)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH active_orders AS (
        SELECT
            o.id,
            o.workflow_stage,
            o.last_stage_change,
            p.required_documents,
            o.document_status
        FROM
            orders o
        JOIN
            patients p ON o.patient_id = p.id
        WHERE
            o.is_archived = false
    ),
    par_ready AS (
        SELECT
            id
        FROM
            active_orders ao
        WHERE
            (SELECT bool_and(ao.document_status->>key = 'Complete') FROM unnest(ao.required_documents) as key)
    ),
    regressions_last_7_days AS (
        SELECT count(*) as count
        FROM public.regressions
        WHERE created_at >= now() - interval '7 days'
    ),
    history_last_7_days AS (
        SELECT count(*) as count
        FROM public.workflow_history
        WHERE changed_at >= now() - interval '7 days'
    )
    SELECT
        (SELECT count(*) FROM active_orders) AS total_orders,
        (SELECT count(*) FROM par_ready) AS ready_for_par_count,
        (SELECT avg(EXTRACT(epoch FROM (now() - ao.last_stage_change)) / 86400.0) FROM active_orders ao) AS avg_days_in_stage,
        (SELECT count FROM regressions_last_7_days) AS regressions_7d,
        (SELECT count FROM history_last_7_days) AS total_history_7d;
END;
$$;

-- Secure the function by setting a safe search path.
ALTER FUNCTION public.get_dashboard_metrics() SET search_path = public;

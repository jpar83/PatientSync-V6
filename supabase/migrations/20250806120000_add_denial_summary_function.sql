/*
  # [Feature] Add Denial Summary Function
  [This operation creates a new database function `get_denial_summary` to efficiently aggregate denial statistics for the dashboard.]
  ## Query Description: [This function calculates the total number of denials and provides a list of patients with their respective denial counts. It's a read-only operation and poses no risk to existing data. This will be used to power a new interactive dashboard component.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Function: public.get_denial_summary()
  ## Security Implications:
  - RLS Status: N/A (Function runs with invoker's rights)
  - Policy Changes: No
  - Auth Requirements: Authenticated users
  ## Performance Impact:
  - Indexes: N/A
  - Triggers: N/A
  - Estimated Impact: Low. The query is efficient and aggregates a small amount of data.
*/
CREATE OR REPLACE FUNCTION public.get_denial_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_denials', (SELECT count(*) FROM public.denials),
        'patients_with_denials', (
            SELECT json_agg(t)
            FROM (
                SELECT
                    p.id as patient_id,
                    p.name as patient_name,
                    count(d.id) as denial_count
                FROM
                    public.denials d
                JOIN
                    public.orders o ON d.order_id = o.id
                JOIN
                    public.patients p ON o.patient_id = p.id
                GROUP BY
                    p.id, p.name
                ORDER BY
                    denial_count DESC
            ) t
        )
    ) INTO result;

    RETURN result;
END;
$$;

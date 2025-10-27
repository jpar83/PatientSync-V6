/*
# [Operation Name]
Update Global Search Function to Remove Intake

## Query Description: [This operation updates the `global_search` function to remove the "Intake" category from its results. This aligns the search functionality with the removal of the Intake dashboard, ensuring users are not directed to a non-existent page. This is a safe, non-destructive change that only affects search behavior.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Modifies the `global_search(text)` function.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible. The query may be slightly faster due to one less UNION.]
*/
CREATE OR REPLACE FUNCTION public.global_search(p_search_term text)
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  route text,
  source_table text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    'patient' AS type,
    '/patients/' || p.id::text AS route,
    'patients' AS source_table
  FROM
    public.patients AS p
  WHERE
    p.name ILIKE '%' || p_search_term || '%'

  UNION ALL

  SELECT
    o.id,
    o.patient_name,
    'referral' AS type,
    '/referrals?highlight=' || o.id::text AS route,
    'orders' AS source_table
  FROM
    public.orders AS o
  WHERE
    o.patient_name ILIKE '%' || p_search_term || '%'
$$;

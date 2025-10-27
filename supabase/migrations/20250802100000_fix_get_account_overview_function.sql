/*
  # [Operation Name]
  Recreate get_account_overview Function (v2)

  ## Query Description: [This operation replaces the existing `get_account_overview` function with a more robust version. The previous version would fail to return data if patients did not have a `primary_insurance` field set. This new version correctly groups such patients under an "Uncategorized" account, ensuring all data is visible and preventing the "My Accounts" page from appearing blank. This is a safe, non-destructive change.]
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by reverting to the old function definition)
  
  ## Structure Details:
  - Function: `get_account_overview()`
  
  ## Security Implications:
  - RLS Status: Not directly affected, function uses `SECURITY DEFINER`.
  - Policy Changes: No
  - Auth Requirements: None
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Low. The function is already optimized for aggregation.
*/

-- Drop the old function to avoid conflict
DROP FUNCTION IF EXISTS get_account_overview();

-- Recreate the function with improved logic
CREATE OR REPLACE FUNCTION get_account_overview()
RETURNS TABLE(
    account_name text,
    total_referrals bigint,
    ready_for_par_count bigint,
    compliance_percentage double precision,
    hot_list jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH account_referrals AS (
        SELECT
            COALESCE(p.primary_insurance, 'Uncategorized') AS account,
            o.id as order_id,
            p.id as patient_id,
            p.name as patient_name,
            p.required_documents,
            o.document_status
        FROM
            patients p
        JOIN
            orders o ON p.id = o.patient_id
        WHERE
            o.is_archived = false
    ),
    compliance_calcs AS (
        SELECT
            ar.account,
            ar.order_id,
            ar.patient_id,
            ar.patient_name,
            ar.required_documents,
            ar.document_status,
            (SELECT COUNT(*) FROM jsonb_object_keys(ar.document_status) doc_key WHERE ar.document_status->>doc_key = 'Complete' AND doc_key = ANY(ar.required_documents)) AS completed_docs,
            array_length(ar.required_documents, 1) AS total_required_docs
        FROM
            account_referrals ar
    ),
    account_stats AS (
        SELECT
            c.account,
            COUNT(DISTINCT c.order_id) AS total_referrals,
            COUNT(DISTINCT c.order_id) FILTER (WHERE c.total_required_docs > 0 AND c.completed_docs >= c.total_required_docs) AS ready_for_par_count,
            COALESCE(AVG(CASE WHEN c.total_required_docs > 0 THEN (c.completed_docs::decimal / c.total_required_docs) * 100 ELSE 100 END), 0) AS compliance_percentage
        FROM
            compliance_calcs c
        GROUP BY
            c.account
    ),
    hot_list_patients AS (
        SELECT
            c.account,
            jsonb_agg(jsonb_build_object('patient_id', c.patient_id, 'patient_name', c.patient_name)) AS hot_list
        FROM (
            SELECT
                c.account,
                c.patient_id,
                c.patient_name,
                ROW_NUMBER() OVER(PARTITION BY c.account ORDER BY (c.total_required_docs - c.completed_docs) DESC, o.created_at ASC) as rn
            FROM
                compliance_calcs c
            JOIN
                orders o ON c.order_id = o.id
            WHERE
                c.total_required_docs > 0 AND c.completed_docs < c.total_required_docs
        ) AS ranked_patients
        WHERE rn <= 5
        GROUP BY
            c.account
    )
    SELECT
        s.account AS account_name,
        s.total_referrals,
        s.ready_for_par_count,
        s.compliance_percentage::double precision,
        COALESCE(h.hot_list, '[]'::jsonb) AS hot_list
    FROM
        account_stats s
    LEFT JOIN
        hot_list_patients h ON s.account = h.account;
END;
$$;

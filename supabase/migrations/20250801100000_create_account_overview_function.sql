/*
          # [Function] get_account_overview
          Creates a function to aggregate referral data by account (primary insurance) for a high-level overview.

          ## Query Description: [This function calculates key performance indicators for each insurance provider, including total referrals, compliance percentage, and a "hot list" of patients needing attention. It is designed to be highly performant by processing data on the server, reducing the load on the client application. No data is modified or deleted.]
          
          ## Metadata:
          - Schema-Category: ["Data"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: public.get_account_overview()
          - Returns: TABLE (account_name TEXT, total_referrals BIGINT, ready_for_par_count BIGINT, compliance_percentage INT, hot_list JSON)
          
          ## Security Implications:
          - RLS Status: [Enabled] - The function runs with the permissions of the calling user (invoker).
          - Policy Changes: [No]
          - Auth Requirements: [User must be authenticated.]
          
          ## Performance Impact:
          - Indexes: [Relies on existing indexes on orders(patient_id, is_archived) and patients(id).]
          - Triggers: [None]
          - Estimated Impact: [Low. This is a read-only function designed for efficient data aggregation.]
          */
CREATE OR REPLACE FUNCTION public.get_account_overview()
RETURNS TABLE(
    account_name text,
    total_referrals bigint,
    ready_for_par_count bigint,
    compliance_percentage integer,
    hot_list json
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SET search_path = public;
  WITH order_compliance AS (
      SELECT
          o.id,
          p.primary_insurance,
          p.id as patient_id,
          p.name as patient_name,
          (
              SELECT coalesce(bool_and(o.document_status->>key = 'Complete'), true)
              FROM jsonb_array_elements_text(p.required_documents) as key
              WHERE p.required_documents IS NOT NULL AND jsonb_array_length(p.required_documents) > 0
          ) as is_compliant,
           (
              SELECT bool_or(o.document_status->>key IS NULL OR o.document_status->>key = 'Missing')
              FROM jsonb_array_elements_text(p.required_documents) as key
               WHERE p.required_documents IS NOT NULL AND jsonb_array_length(p.required_documents) > 0
          ) as has_missing_docs
      FROM
          orders o
      JOIN
          patients p ON o.patient_id = p.id
      WHERE
          o.is_archived = false AND p.primary_insurance IS NOT NULL
  )
  SELECT
      oc.primary_insurance as account_name,
      count(*)::bigint as total_referrals,
      count(*) FILTER (WHERE oc.is_compliant)::bigint as ready_for_par_count,
      CASE 
          WHEN count(*) > 0 THEN (count(*) FILTER (WHERE oc.is_compliant) * 100.0 / count(*))::integer
          ELSE 0
      END as compliance_percentage,
      (
          SELECT json_agg(json_build_object('patient_id', sub.patient_id, 'patient_name', sub.patient_name))
          FROM (
              SELECT
                  sub_oc.patient_id,
                  sub_oc.patient_name
              FROM
                  order_compliance sub_oc
              WHERE
                  sub_oc.primary_insurance = oc.primary_insurance AND sub_oc.has_missing_docs = true
              ORDER BY sub_oc.patient_name
              LIMIT 5
          ) sub
      ) as hot_list
  FROM
      order_compliance oc
  GROUP BY
      oc.primary_insurance;
$$;

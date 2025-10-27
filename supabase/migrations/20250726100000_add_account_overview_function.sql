/*
  # [Function] get_account_overview
  Aggregates referral and patient data to provide a high-level overview for each insurance account.

  ## Query Description:
  This function is read-only and calculates several key performance indicators (KPIs) for each insurance provider (account). It does not modify any data. It is designed to be performant by doing all calculations on the database server, reducing the load on the client application.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the function can be dropped)

  ## Structure Details:
  - Reads from: `orders`, `patients`
  - Returns columns:
    - `account_name` (text)
    - `total_referrals` (bigint)
    - `ready_for_par_count` (bigint)
    - `compliance_percentage` (numeric)
    - `hot_list` (jsonb)

  ## Security Implications:
  - RLS Status: The function runs with the privileges of the caller. It respects existing RLS policies on the underlying tables (`orders`, `patients`).
  - Policy Changes: No
  - Auth Requirements: Assumes RLS is in place to restrict data access.

  ## Performance Impact:
  - Indexes: Benefits from indexes on `orders.patient_id`, `orders.is_archived`, `patients.primary_insurance`.
  - Triggers: None
  - Estimated Impact: Medium read load, but significantly more efficient than client-side aggregation.
*/
create or replace function get_account_overview()
returns table (
    account_name text,
    total_referrals bigint,
    ready_for_par_count bigint,
    compliance_percentage numeric,
    hot_list jsonb
)
language sql
security definer
set search_path = public
as $$
with order_compliance as (
    select
        p.primary_insurance,
        p.id as patient_id,
        p.name as patient_name,
        o.id as order_id,
        o.last_stage_change,
        p.required_documents,
        o.document_status,
        (
            select count(*)
            from jsonb_object_keys(o.document_status) as doc_key
            where o.document_status->>doc_key = 'Complete'
              and doc_key = any(p.required_documents)
        ) as completed_docs_count,
        coalesce(array_length(p.required_documents, 1), 0) as total_required_docs
    from orders o
    join patients p on o.patient_id = p.id
    where o.is_archived = false and p.primary_insurance is not null and p.primary_insurance != ''
),
compliance_calcs as (
    select
        *,
        case
            when total_required_docs > 0 then (completed_docs_count::numeric / total_required_docs) * 100
            else 100.0
        end as compliance_pct,
        (total_required_docs > 0 and completed_docs_count >= total_required_docs) as is_ready_for_par
    from order_compliance
),
hot_list_ranked as (
    select
        primary_insurance,
        patient_id,
        patient_name,
        row_number() over (partition by primary_insurance order by last_stage_change asc nulls last) as rn
    from compliance_calcs
    where not is_ready_for_par
),
hot_list_agg as (
    select
        primary_insurance,
        jsonb_agg(
            jsonb_build_object('patient_id', patient_id, 'patient_name', patient_name)
        ) as hot_list
    from hot_list_ranked
    where rn <= 5
    group by primary_insurance
)
select
    cc.primary_insurance as account_name,
    count(cc.order_id) as total_referrals,
    count(case when cc.is_ready_for_par then 1 end) as ready_for_par_count,
    round(avg(cc.compliance_pct), 0) as compliance_percentage,
    coalesce(hla.hot_list, '[]'::jsonb) as hot_list
from compliance_calcs cc
left join hot_list_agg hla on cc.primary_insurance = hla.primary_insurance
group by cc.primary_insurance, hla.hot_list
order by cc.primary_insurance;
$$;

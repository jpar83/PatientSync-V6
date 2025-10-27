/*
          # [Operation Name]
          Create Account Overview Function

          ## Query Description: [This operation creates a new PostgreSQL function named `get_account_overview`. This function is designed to aggregate and summarize referral data for each insurance provider (account), calculating key performance indicators (KPIs) like total referrals, compliance percentage, and a "hot list" of patients needing attention. It is a read-only function and does not modify any existing data, making it safe to run. It improves performance by offloading complex calculations from the client application to the database server.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Creates a new SQL function: `get_account_overview()`
          
          ## Security Implications:
          - RLS Status: Not applicable to function creation.
          - Policy Changes: No
          - Auth Requirements: The function is defined with `SECURITY DEFINER` to run with the permissions of the function owner.
          
          ## Performance Impact:
          - Indexes: Does not add or modify indexes.
          - Triggers: Does not add or modify triggers.
          - Estimated Impact: Positive. This function is designed to improve application performance by centralizing data aggregation on the database server, reducing the amount of data transferred to the client and minimizing client-side processing.
          */
create or replace function get_account_overview()
returns table(
    account_name text,
    total_referrals bigint,
    ready_for_par_count bigint,
    compliance_percentage integer,
    hot_list jsonb
)
language sql
security definer
as $$
    with patient_compliance as (
        select
            p.id as patient_id,
            p.name as patient_name,
            p.primary_insurance,
            o.referral_date,
            o.id as order_id,
            coalesce(array_length(p.required_documents, 1), 0) as total_required,
            (
                select count(*)
                from jsonb_object_keys(o.document_status) as doc_key
                where o.document_status->>doc_key = 'Complete' and doc_key = any(p.required_documents)
            ) as total_complete
        from patients p
        join orders o on p.id = o.patient_id
        where o.is_archived = false and p.primary_insurance is not null
    ),
    account_aggregates as (
        select
            pc.primary_insurance as account,
            count(*) as total_referrals,
            count(case when pc.total_required > 0 and pc.total_complete >= pc.total_required then 1 end) as ready_for_par_count,
            case
                when sum(pc.total_required) > 0 then (sum(pc.total_complete) * 100 / sum(pc.total_required))::integer
                else 100
            end as compliance_percentage
        from patient_compliance pc
        group by pc.primary_insurance
    ),
    hot_list_ranked as (
        select
            pc.primary_insurance as account,
            pc.patient_id,
            pc.patient_name,
            row_number() over(partition by pc.primary_insurance order by pc.referral_date asc) as rn
        from patient_compliance pc
        where pc.total_complete < pc.total_required
    )
    select
        aa.account as account_name,
        aa.total_referrals,
        aa.ready_for_par_count,
        aa.compliance_percentage,
        (
            select coalesce(jsonb_agg(jsonb_build_object('patient_id', hlr.patient_id, 'patient_name', hlr.patient_name)), '[]'::jsonb)
            from hot_list_ranked hlr
            where hlr.account = aa.account and hlr.rn <= 5
        ) as hot_list
    from account_aggregates aa;
$$;

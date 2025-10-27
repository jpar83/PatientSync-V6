/*
          # [Operation Name]
          Create Account Overview Function

          ## Query Description: [This operation creates a new PostgreSQL function named `get_account_overview`. This function is designed to be called via RPC from the application to efficiently aggregate and summarize data for the "My Accounts" page. It calculates key performance indicators (KPIs) for each insurance provider (account), such as total referrals, compliance percentage, and the number of referrals ready for preauthorization (PAR). It also identifies a "hot list" of the most urgent patients needing attention. This function is read-only and does not modify any data, making it safe to run. It improves application performance by offloading complex calculations from the client to the database server.]
          
          ## Metadata:
          - Schema-Category: ["Safe", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Creates a new SQL function: `get_account_overview()`
          - Reads from tables: `orders`, `patients`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [The function respects existing RLS policies. Users will only see data they are permitted to access.]
          
          ## Performance Impact:
          - Indexes: [Relies on existing indexes on `orders.patient_id`, `orders.is_archived`, and `patients.primary_insurance` for efficient joins and filtering.]
          - Triggers: [No]
          - Estimated Impact: [Positive. Significantly improves the performance of the "My Accounts" page by replacing multiple client-side queries and calculations with a single, efficient database RPC call.]
          */
create or replace function get_account_overview()
returns table(
    account_name text,
    total_referrals bigint,
    ready_for_par_count bigint,
    compliance_percentage numeric,
    hot_list jsonb
) as $$
    with account_orders as (
        select
            p.primary_insurance as acc_name,
            o.patient_id,
            p.name as patient_name,
            p.required_documents,
            o.document_status,
            (p.required_documents is not null and array_length(p.required_documents, 1) > 0 and
             p.required_documents::text[] <@ (select array_agg(key) from jsonb_each_text(coalesce(o.document_status, '{}'::jsonb)) where value = 'Complete')) as is_ready_for_par,
            (select count(*) from unnest(p.required_documents) as doc where coalesce(o.document_status, '{}'::jsonb)->>doc = 'Complete') as completed_docs_count,
            array_length(p.required_documents, 1) as total_required_docs,
            (current_date - o.referral_date::date) as age_days
        from orders o
        join patients p on o.patient_id = p.id
        where o.is_archived = false and p.primary_insurance is not null
    ),
    account_kpis as (
        select
            acc_name,
            count(*) as total_referrals,
            count(*) filter (where is_ready_for_par) as ready_for_par_count,
            coalesce(
                sum(completed_docs_count) * 100.0 / nullif(sum(total_required_docs), 0),
                100.0
            ) as compliance_percentage
        from account_orders
        group by acc_name
    ),
    hot_list_ranked as (
        select
            acc_name,
            patient_id,
            patient_name,
            row_number() over (partition by acc_name order by age_days desc) as rn
        from account_orders
        where not is_ready_for_par
    ),
    hot_lists as (
        select
            acc_name,
            jsonb_agg(jsonb_build_object('patient_id', patient_id, 'patient_name', patient_name)) as hot_list
        from hot_list_ranked
        where rn <= 5
        group by acc_name
    )
    select
        k.acc_name as account_name,
        k.total_referrals,
        k.ready_for_par_count,
        round(k.compliance_percentage, 0) as compliance_percentage,
        coalesce(h.hot_list, '[]'::jsonb) as hot_list
    from account_kpis k
    left join hot_lists h on k.acc_name = h.acc_name;
$$ language sql stable;

/*
  # [Operation Name]
  Add Performance Indexes

  ## Query Description: [This operation adds several indexes to the database to improve query performance for common filtering, sorting, and searching operations. These changes are non-destructive and should not impact existing data. They are designed to make the application faster and more responsive, especially as the data grows.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Adds indexes to: patients, orders, marketing_leads, marketing_touchpoints
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [N/A]
  
  ## Performance Impact:
  - Indexes: [Added]
  - Triggers: [N/A]
  - Estimated Impact: [Positive. Should significantly speed up read queries on the affected tables.]
*/

-- Indexes for 'patients' table
create index if not exists idx_patients_name_trgm on public.patients using gin (name extensions.gin_trgm_ops);
create index if not exists idx_patients_primary_insurance on public.patients (primary_insurance);
create index if not exists idx_patients_archived on public.patients (archived);

-- Indexes for 'orders' table
create index if not exists idx_orders_workflow_stage on public.orders (workflow_stage);
create index if not exists idx_orders_is_archived on public.orders (is_archived);
create index if not exists idx_orders_patient_id on public.orders (patient_id);
create index if not exists idx_orders_referral_date on public.orders (referral_date);

-- Indexes for 'marketing_leads' table (some might exist, `if not exists` handles it)
create index if not exists idx_leads_name_trgm on public.marketing_leads using gin (name extensions.gin_trgm_ops);
create index if not exists idx_leads_city_state on public.marketing_leads (city, state);

-- Indexes for 'marketing_touchpoints' table
create index if not exists idx_touchpoints_lead_id on public.marketing_touchpoints (lead_id);

/*
  # [Operation Name]
  Add Performance Indexes (Corrected)

  ## Query Description: [This operation adds several indexes to the database to improve query performance for common filtering, sorting, and searching operations. This is a corrected version of the previous script to fix a syntax error related to the 'pg_trgm' extension.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Adds GIN/GiST indexes for text search on 'patients' and 'marketing_leads'.
  - Adds B-tree indexes on foreign keys and frequently filtered columns.
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [Added]
  - Triggers: [None]
  - Estimated Impact: [Significant improvement in read query performance for filtering and searching.]
*/

-- Indexes for 'patients' table
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON public.patients USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_primary_insurance ON public.patients (primary_insurance);
CREATE INDEX IF NOT EXISTS idx_patients_archived ON public.patients (archived);
CREATE INDEX IF NOT EXISTS idx_patients_stoplight_status ON public.patients (stoplight_status);

-- Indexes for 'orders' table
CREATE INDEX IF NOT EXISTS idx_orders_patient_id ON public.orders (patient_id);
CREATE INDEX IF NOT EXISTS idx_orders_workflow_stage ON public.orders (workflow_stage);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_is_archived ON public.orders (is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_stoplight_status ON public.orders (stoplight_status);
CREATE INDEX IF NOT EXISTS idx_orders_referral_date ON public.orders (referral_date);

-- Indexes for 'marketing_leads' table
CREATE INDEX IF NOT EXISTS idx_marketing_leads_name_trgm ON public.marketing_leads USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_next_action ON public.marketing_leads(next_action_at);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.marketing_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.marketing_leads(lead_status);

-- Indexes for 'marketing_touchpoints' table
CREATE INDEX IF NOT EXISTS idx_tp_lead_occurred ON public.marketing_touchpoints(lead_id, occurred_at desc);

-- Indexes for 'marketing_in_services' table
CREATE INDEX IF NOT EXISTS idx_mis_start ON public.marketing_in_services(start_at);
CREATE INDEX IF NOT EXISTS idx_mis_event_type ON public.marketing_in_services(event_type);

-- Indexes for 'denials' table
CREATE INDEX IF NOT EXISTS idx_denials_order_id ON public.denials (order_id);

-- Indexes for 'equipment' table
CREATE INDEX IF NOT EXISTS idx_equipment_order_id ON public.equipment (order_id);

-- Indexes for 'patient_notes' table
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON public.patient_notes (patient_id);

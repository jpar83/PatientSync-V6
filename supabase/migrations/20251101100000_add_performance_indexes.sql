/*
          # [Operation Name]
          Add Performance Indexes

          ## Query Description: [This operation adds several indexes to your database tables to improve the performance of common search, filter, and sort operations. It is a safe, non-destructive operation that does not alter any existing data. It will make the application feel faster, especially as your dataset grows.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Adds GIN trigram indexes for text searching on `patients` and `marketing_leads`.
          - Adds standard B-tree indexes on common filter columns like `status` and `stage`.
          - Adds a GIN index on the JSONB `details` column of `audit_log` for faster lookups.
          
          ## Security Implications:
          - RLS Status: Not Applicable
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [None]
          - Estimated Impact: [Positive. Queries using the indexed columns will be significantly faster. There will be a minor overhead on write operations (INSERT/UPDATE) to maintain the indexes, but this is a standard and worthwhile trade-off for query performance.]
          */
-- Indexes for text search on Patients
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON public.patients USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_email_trgm ON public.patients USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_insurance_trgm ON public.patients USING gin (primary_insurance gin_trgm_ops);

-- Indexes for common filters on Patients
CREATE INDEX IF NOT EXISTS idx_patients_stoplight ON public.patients (stoplight_status);
CREATE INDEX IF NOT EXISTS idx_patients_archived ON public.patients (archived);

-- Indexes for common filters on Orders
CREATE INDEX IF NOT EXISTS idx_orders_workflow_stage ON public.orders (workflow_stage);
CREATE INDEX IF NOT EXISTS idx_orders_stoplight ON public.orders (stoplight_status);
CREATE INDEX IF NOT EXISTS idx_orders_patient_id ON public.orders (patient_id);

-- Indexes for Marketing Leads
CREATE INDEX IF NOT EXISTS idx_marketing_leads_name_trgm ON public.marketing_leads USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON public.marketing_leads (lead_status);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_next_action ON public.marketing_leads (next_action_at);

-- Index for faster audit log lookups by patient
CREATE INDEX IF NOT EXISTS idx_audit_log_patient_id ON public.audit_log USING gin ((details -> 'patient_id'));

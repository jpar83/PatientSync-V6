/*
          # [Operation Name]
          Add Performance Indexes

          ## Query Description: [This script adds several indexes to the database to improve query performance. These changes are non-destructive and are designed to speed up filtering, sorting, and searching across the application. No data will be modified, and the changes are fully reversible.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Adds B-tree indexes to foreign keys and frequently filtered columns on `orders`, `patients`, `equipment`, and `denials`.
          - Adds a composite index to `patient_notes` for faster timeline loading.
          - Adds a GIN index to `audit_log.details` for efficient JSONB searching.
          - Adds a trigram index to `patients.name` for faster `ILIKE` search performance.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [None]
          - Estimated Impact: [Positive. Queries involving filtering by patient, order, workflow stage, and searching by name will be significantly faster. Write performance will have a negligible impact.]
          */

-- Enable pg_trgm for faster text searching if it's not already enabled.
create extension if not exists pg_trgm with schema extensions;

-- Indexes for the 'orders' table
create index if not exists idx_orders_patient_id on public.orders(patient_id);
create index if not exists idx_orders_workflow_stage on public.orders(workflow_stage);
create index if not exists idx_orders_is_archived on public.orders(is_archived);

-- Indexes for the 'patients' table
-- A trigram index is highly effective for ILIKE and similarity searches.
create index if not exists idx_patients_name_trgm on public.patients using gin (name extensions.gin_trgm_ops);
create index if not exists idx_patients_email on public.patients(email);
create index if not exists idx_patients_archived on public.patients(archived);

-- Composite index for notes, perfect for fetching a patient's timeline sorted by date.
create index if not exists idx_patient_notes_patient_id_created_at on public.patient_notes(patient_id, created_at DESC);

-- GIN index for JSONB searching in audit logs.
create index if not exists idx_audit_log_details_gin on public.audit_log using gin (details);

-- Indexes for foreign keys on related tables.
create index if not exists idx_equipment_order_id on public.equipment(order_id);
create index if not exists idx_denials_order_id on public.denials(order_id);
create index if not exists idx_marketing_in_services_lead_id on public.marketing_in_services(lead_id);

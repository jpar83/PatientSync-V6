/*
          # Create Equipment and Denials Tables
          This migration script creates two new tables, `equipment` and `denials`, to track detailed information about medical equipment and insurance denials associated with each referral.

          ## Query Description: 
          This operation is structural and adds new tables without altering existing data. It is safe to run on a production database, but a backup is always recommended before any schema change.

          - The `equipment` table will store records of all equipment provided, including model, serial number, vendor, and delivery status.
          - The `denials` table will log each instance of an insurance denial, including the date, reason, and appeal status.
          - Both tables are linked to `orders` and `patients` for data integrity.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - **New Table:** `public.equipment`
            - Columns: id, order_id, patient_id, created_at, category, equipment_type, model, serial_number, vendor_id, date_delivered, status, notes, is_returned, date_returned, is_repaired, date_repaired
          - **New Table:** `public.denials`
            - Columns: id, order_id, patient_id, created_at, denial_date, payer, reason_code, reason_text, stage_at_denial, appeal_filed, appeal_date, appeal_outcome, resolved, notes
          
          ## Security Implications:
          - RLS Status: Enabled on both new tables.
          - Policy Changes: Yes, new policies are added to allow authenticated users to manage records.
          - Auth Requirements: Authenticated user role.
          
          ## Performance Impact:
          - Indexes: Primary keys and foreign keys are indexed automatically. No custom indexes added.
          - Triggers: None.
          - Estimated Impact: Low. The new tables will not impact the performance of existing queries until they are actively used.
          */

CREATE TABLE IF NOT EXISTS public.equipment (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    category text,
    equipment_type text,
    model text,
    serial_number text,
    vendor_id uuid,
    date_delivered date,
    status text,
    notes text,
    is_returned boolean DEFAULT false,
    date_returned date,
    is_repaired boolean DEFAULT false,
    date_repaired date,
    CONSTRAINT equipment_pkey PRIMARY KEY (id),
    CONSTRAINT equipment_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT equipment_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT equipment_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.equipment IS 'Stores records of equipment associated with an order.';

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users on equipment" ON public.equipment FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.denials (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    denial_date date NOT NULL,
    payer text,
    reason_code text,
    reason_text text,
    stage_at_denial text,
    appeal_filed boolean DEFAULT false,
    appeal_date date,
    appeal_outcome text,
    resolved boolean DEFAULT false,
    notes text,
    CONSTRAINT denials_pkey PRIMARY KEY (id),
    CONSTRAINT denials_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT denials_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.denials IS 'Stores records of insurance denials for an order.';

ALTER TABLE public.denials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users on denials" ON public.denials FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

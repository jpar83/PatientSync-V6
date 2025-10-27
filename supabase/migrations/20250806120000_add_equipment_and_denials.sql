/*
  # [Structural] Create Equipment Tracking Table
  [This operation creates a new table `public.equipment` to track details about the durable medical equipment associated with an order.]
  ## Query Description: [Creates the `equipment` table with columns for type, model, serial number, vendor, delivery date, and status. It links to the `orders` table. This is a non-destructive addition to the schema.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Table: public.equipment
  - Columns: id, order_id, equipment_type, equipment_model, serial_number, vendor_id, date_delivered, status, created_at
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (new policies for the new table)
  - Auth Requirements: Authenticated user
  ## Performance Impact:
  - Indexes: Adds a primary key index and a foreign key index on `order_id`.
  - Triggers: None
  - Estimated Impact: Low.
*/
CREATE TABLE IF NOT EXISTS public.equipment (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    equipment_type text,
    equipment_model text,
    serial_number text,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
    date_delivered date,
    status text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.equipment;
CREATE POLICY "Allow all access to authenticated users" ON public.equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);
COMMENT ON TABLE public.equipment IS 'Tracks specific equipment details related to an order.';

/*
  # [Structural] Create Denial Tracking Table
  [This operation creates a new table `public.denials` to log insurance denial events for each order.]
  ## Query Description: [Creates the `denials` table to record denial dates, reasons, notes, and appeal status. It links to the `orders` table. This is a non-destructive addition to the schema.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Table: public.denials
  - Columns: id, order_id, denial_date, denial_reason, notes, appeal_filed, appeal_date, appeal_outcome, resolved_date, created_at
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (new policies for the new table)
  - Auth Requirements: Authenticated user
  ## Performance Impact:
  - Indexes: Adds a primary key index and a foreign key index on `order_id`.
  - Triggers: None
  - Estimated Impact: Low.
*/
CREATE TABLE IF NOT EXISTS public.denials (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    denial_date date NOT NULL DEFAULT timezone('utc'::text, now()),
    denial_reason text,
    notes text,
    appeal_filed boolean DEFAULT false,
    appeal_date date,
    appeal_outcome text,
    resolved_date date,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.denials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.denials;
CREATE POLICY "Allow all access to authenticated users" ON public.denials FOR ALL TO authenticated USING (true) WITH CHECK (true);
COMMENT ON TABLE public.denials IS 'Logs insurance denial events for tracking and reporting.';

/*
  # [Structural] Add Administrative Columns
  [This operation adds new columns to the `orders` and `patients` tables for enhanced tracking and reporting.]
  ## Query Description: [Adds `case_type`, `assigned_to`, `intake_coordinator_id`, and `referral_source` to the `orders` table, and `payer_region` to the `patients` table. These are non-destructive additions and will be populated with NULL values initially.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Tables: public.orders, public.patients
  - Columns Added: case_type, assigned_to, intake_coordinator_id, referral_source, payer_region
  ## Security Implications:
  - RLS Status: N/A (inherits existing table policies)
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS case_type text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS intake_coordinator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS payer_region text;

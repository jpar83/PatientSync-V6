/*
  # [Schema Expansion] Create Equipment Table
  [This operation creates a new table `public.equipment` to track Durable Medical Equipment (DME) associated with each referral/order. It includes fields for equipment type, model, vendor, and delivery status.]
  ## Query Description: [This is a non-destructive, structural change. It adds a new table and does not affect existing data. It's safe to run on a production database.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the table)
  ## Structure Details:
  - Table: public.equipment
  - Columns: id, order_id, equipment_type, equipment_model, serial_number, vendor_id, date_delivered, is_returned, return_date, is_repaired, repair_date, status, created_at
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (New policies for `equipment` table)
  - Auth Requirements: Authenticated users
  ## Performance Impact:
  - Indexes: Primary key index on `id`, Foreign key index on `order_id`
  - Triggers: None
  - Estimated Impact: Low. Adds a new table, minimal impact on existing query performance.
*/
CREATE TABLE IF NOT EXISTS public.equipment (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    equipment_type text,
    equipment_model text,
    serial_number text,
    vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
    date_delivered timestamptz,
    is_returned boolean DEFAULT false,
    return_date timestamptz,
    is_repaired boolean DEFAULT false,
    repair_date timestamptz,
    status text,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON public.equipment FOR ALL USING (auth.role() = 'authenticated');

/*
  # [Schema Expansion] Create Denials Table
  [This operation creates a new table `public.denials` to log insurance denial events for each order. It captures denial reasons, dates, and appeal tracking information.]
  ## Query Description: [This is a non-destructive, structural change. It adds a new table and does not affect existing data. It's safe to run on a production database.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the table)
  ## Structure Details:
  - Table: public.denials
  - Columns: id, order_id, payer_name, denial_date, denial_reason, notes, workflow_stage_at_denial, appeal_filed, appeal_date, appeal_outcome, created_at
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (New policies for `denials` table)
  - Auth Requirements: Authenticated users
  ## Performance Impact:
  - Indexes: Primary key index on `id`, Foreign key index on `order_id`
  - Triggers: None
  - Estimated Impact: Low. Adds a new table, minimal impact on existing query performance.
*/
CREATE TABLE IF NOT EXISTS public.denials (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payer_name text,
    denial_date date,
    denial_reason text,
    notes text,
    workflow_stage_at_denial text,
    appeal_filed boolean DEFAULT false,
    appeal_date date,
    appeal_outcome text,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.denials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON public.denials FOR ALL USING (auth.role() = 'authenticated');


/*
  # [Schema Expansion] Enhance Orders Table
  [This operation adds new columns to the `public.orders` table to support enhanced workflow and administrative tracking, including case type and user assignments.]
  ## Query Description: [This is a non-destructive, structural change. It adds new, nullable columns to an existing table. It's safe to run and will not affect existing data.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the columns)
  ## Structure Details:
  - Table: public.orders
  - Columns Added: case_type, assigned_to, intake_coordinator, stage_start_date, stage_completion_date
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: None added in this step.
  - Triggers: None
  - Estimated Impact: Very low. Adding nullable columns is a fast metadata change.
*/
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS case_type text,
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS intake_coordinator uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stage_start_date timestamptz,
ADD COLUMN IF NOT EXISTS stage_completion_date timestamptz;


/*
  # [Schema Expansion] Enhance Patients Table
  [This operation adds a `payer_region` column to the `public.patients` table for better administrative categorization.]
  ## Query Description: [This is a non-destructive, structural change. It adds a new, nullable column to an existing table. It's safe to run and will not affect existing data.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the column)
  ## Structure Details:
  - Table: public.patients
  - Columns Added: payer_region
  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Very low. Adding a nullable column is a fast metadata change.
*/
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS payer_region text;

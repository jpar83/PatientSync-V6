/*
          # [Operation Name]
          Add Unified Form Fields

          [This migration adds new optional columns to the `patients` and `orders` tables to support a unified patient form interface. It includes fields for PCP, preferred contact method, and additional order details.]

          ## Query Description: ["This operation adds new columns with default NULL values to the `patients` and `orders` tables. It is a non-destructive, structural change and will not impact existing data. No backup is required."]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table 'patients': Adds columns `pcp_name`, `pcp_phone`, `preferred_contact_method`, `created_by`, `modified_by`.
          - Table 'orders': Adds columns `insurance_verified`, `authorization_number`, `order_date`, `created_by`, `modified_by`.
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None for this migration.
          
          ## Performance Impact:
          - Indexes: None added.
          - Triggers: None added.
          - Estimated Impact: Negligible performance impact. Adding nullable columns is a fast metadata change.
          */

-- Add columns to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS pcp_name TEXT,
ADD COLUMN IF NOT EXISTS pcp_phone TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS modified_by TEXT;

-- Add columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS authorization_number TEXT,
ADD COLUMN IF NOT EXISTS order_date DATE,
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS modified_by TEXT;

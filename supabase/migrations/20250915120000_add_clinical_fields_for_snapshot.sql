/*
# [Operation Name] Add Clinical Fields for Snapshot PDF
[This operation adds new columns to the `patients` and `orders` tables to support a more comprehensive patient snapshot PDF report.]

## Query Description: [Adds `diagnosis`, `height`, and `weight` to the `patients` table, and `justification` to the `orders` table. These fields are nullable and will not impact existing data. No backup is required as this is a non-destructive, additive change.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table `patients`:
  - Adds column `diagnosis` (TEXT)
  - Adds column `height` (TEXT)
  - Adds column `weight` (TEXT)
- Table `orders`:
  - Adds column `justification` (TEXT)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None added
- Triggers: None added
- Estimated Impact: Negligible performance impact on table operations.
*/

-- Add columns to the patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT;

-- Add column to the orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS justification TEXT;

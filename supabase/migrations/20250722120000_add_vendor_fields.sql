/*
          # [Operation Name]
          Add Contact Fields to Vendors Table

          ## Query Description: [This operation adds new columns to the `vendors` table to store more detailed contact information. It is a non-destructive, structural change and will not affect existing data. Existing rows will have `NULL` values for these new columns until they are updated.]

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Table: `public.vendors`
          - Columns Added: `contact_name` (TEXT), `phone_number` (TEXT), `city` (TEXT)

          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: Admin privileges to alter tables.

          ## Performance Impact:
          - Indexes: None added
          - Triggers: None added
          - Estimated Impact: Negligible.
          */
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

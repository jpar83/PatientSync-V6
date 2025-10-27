/*
          # [Operation Name]
          Add Detailed Contact Fields to Doctors Table

          ## Query Description: [This operation adds several new, optional text fields to the `doctors` table to store more detailed contact information. It is a non-destructive, structural change that will not affect existing data. The new fields are `phone_number`, `fax_number`, `office_contact_name`, `office_contact_email`, and `office_phone_number`.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table(s) Affected: `public.doctors`
          - Column(s) Added: `phone_number`, `fax_number`, `office_contact_name`, `office_contact_email`, `office_phone_number`
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None added
          - Triggers: None added
          - Estimated Impact: Negligible performance impact.
          */

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS fax_number TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS office_contact_name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS office_contact_email TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS office_phone_number TEXT;

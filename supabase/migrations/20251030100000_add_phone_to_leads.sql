/*
  # [Feature] Add Phone Number to Marketing Leads
  [This migration adds phone number and extension fields to the marketing_leads table to store primary contact numbers for lead organizations.]

  ## Query Description: [This operation adds two new text columns, `phone` and `phone_extension`, to the `public.marketing_leads` table. It is a non-destructive, structural change and will not affect existing data. Existing rows will have NULL values for these new columns.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: public.marketing_leads
    - Columns Added:
      - phone (text)
      - phone_extension (text)

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: None added
  - Triggers: None added
  - Estimated Impact: Negligible. The new columns are nullable and do not have default values, so the update is metadata-only.
*/

alter table public.marketing_leads
  add column if not exists phone text,
  add column if not exists phone_extension text;

/*
# [Structural] Add Notes Column to Marketing Leads
This migration adds a `notes` column to the `marketing_leads` table to allow for storing additional text information with each lead.

## Query Description: [This is a non-destructive operation that adds a new `notes` column of type TEXT to the `public.marketing_leads` table. Existing data will not be affected, and the new column will be `NULL` for all existing rows.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.marketing_leads`
  - Column Added: `notes` (TEXT)

## Security Implications:
- RLS Status: Unchanged. Existing policies on `marketing_leads` will apply.
- Policy Changes: No.
- Auth Requirements: The `authenticated` role will need `INSERT` and `UPDATE` permissions on this new column, which is typically inherited from table-level grants.

## Performance Impact:
- Indexes: None added.
- Triggers: None added.
- Estimated Impact: Negligible. Adding a nullable column is a fast metadata-only change in PostgreSQL.
*/

ALTER TABLE public.marketing_leads
ADD COLUMN notes TEXT;

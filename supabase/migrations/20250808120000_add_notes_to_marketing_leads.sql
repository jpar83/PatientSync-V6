/*
# [FEATURE] Add Notes to Marketing Leads
This migration adds a `notes` column to the `marketing_leads` table to store general notes about a marketing lead.

## Query Description:
This is a non-destructive operation that adds a new `notes` column of type `TEXT` to the `marketing_leads` table. Existing rows will have a `NULL` value for this new column. There is no risk of data loss.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the column)

## Structure Details:
- Table: `public.marketing_leads`
- Column Added: `notes` (Type: `TEXT`)

## Security Implications:
- RLS Status: Unchanged. Existing policies on `marketing_leads` will apply.
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None added.
- Triggers: None added.
- Estimated Impact: Negligible. Adding a nullable column is a fast metadata change.
*/

ALTER TABLE public.marketing_leads
ADD COLUMN notes TEXT;

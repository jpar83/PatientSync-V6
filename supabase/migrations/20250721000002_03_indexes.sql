/*
# [Indexes] Create Trigram Indexes for Search
This migration adds GIN indexes using the pg_trgm extension on the `name` and `email` columns of the `patients` table to significantly speed up fuzzy text searching.

## Query Description: [This operation creates specialized indexes to improve search performance. It will not affect existing data, but the index creation might briefly lock the 'patients' table. This is a one-time operation that makes future text searches much faster. Re-running this script is safe as it checks for the existence of the indexes before creating them.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the indexes)

## Structure Details:
- Table: `public.patients`
- Indexes Added: `patients_name_trgm_idx`, `patients_email_trgm_idx`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Adds two GIN trigram indexes. This will dramatically improve the performance of `ILIKE` and similarity searches on the `name` and `email` fields.
- Triggers: None
- Estimated Impact: High (Positive). Search operations will be significantly faster.
*/

-- Create indexes for faster fuzzy text search on patients table.
-- These are crucial for the performance of the global_search function.
CREATE INDEX IF NOT EXISTS patients_name_trgm_idx ON public.patients USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS patients_email_trgm_idx ON public.patients USING gin (email gin_trgm_ops);

/*
# [Indexes] Add Trigram Indexes for Fuzzy Search
This migration creates trigram (GIN) indexes on the `name` and `email` columns of the `patients` table. These indexes are essential for the performance of the `global_search` function.

## Query Description:
- Enables the `pg_trgm` extension, which provides functions and operators for determining the similarity of text based on trigram matching.
- Creates a GIN index on the `name` column.
- Creates a GIN index on the `email` column.
- GIN indexes are well-suited for indexing composite values and for searching for items that contain specific elements, making them ideal for trigram-based fuzzy searching.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the indexes)

## Structure Details:
- Table: `patients`
- Indexes Added: `idx_patients_name_gin_trgm`, `idx_patients_email_gin_trgm`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: These indexes will significantly speed up fuzzy text searches on the `name` and `email` fields. They will add a small overhead to insert and update operations on the `patients` table.
- Triggers: None
- Estimated Impact: High positive impact on search performance, low negative impact on writes.
*/

-- Enable the pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for fast fuzzy searching on patient name and email
CREATE INDEX IF NOT EXISTS idx_patients_name_gin_trgm ON public.patients USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_patients_email_gin_trgm ON public.patients USING gin (email gin_trgm_ops);

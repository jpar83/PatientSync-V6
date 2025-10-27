/*
# [Operation Name]
Add `archived_at` column to `profiles` table

## Query Description: [This operation adds a new `archived_at` column to the `profiles` table to allow for soft-deleting/archiving user profiles. This is a non-destructive change and will not affect existing data. All current profiles will have a `NULL` value for this new column, indicating they are active.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table `public.profiles`:
  - Adds column `archived_at` (TIMESTAMPTZ, nullable, default NULL)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: [No]
- Auth Requirements: [None for this migration]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible. Adding a nullable column is a fast metadata-only change in PostgreSQL.]
*/
ALTER TABLE public.profiles
ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.profiles.archived_at IS 'Timestamp when the user profile was archived. NULL if active.';

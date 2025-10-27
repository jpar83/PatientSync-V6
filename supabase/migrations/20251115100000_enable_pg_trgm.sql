/*
# [Enable pg_trgm Extension]
[This operation enables the `pg_trgm` extension, which is required for efficient text searching using trigram matching. This is a prerequisite for creating certain types of indexes that improve search performance.]

## Query Description: [Enables the `pg_trgm` extension if it is not already enabled. This is a safe, non-destructive operation that adds new capabilities to the database.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
[Adds the `pg_trgm` extension to the `extensions` schema.]

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [Superuser/Admin privileges required to run]

## Performance Impact:
- Indexes: [Enables creation of GIN/GiST indexes using `gin_trgm_ops` or `gist_trgm_ops`.]
- Triggers: [None]
- Estimated Impact: [Low impact on its own. Enables significant performance improvements for text search queries once indexes are created.]
*/
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

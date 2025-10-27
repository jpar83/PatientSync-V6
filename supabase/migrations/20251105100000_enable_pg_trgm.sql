/*
# [Enable pg_trgm Extension]
Enables the `pg_trgm` PostgreSQL extension, which provides functions and operators for determining the similarity of text based on trigram matching. This is essential for optimizing performance on `LIKE` and `ILIKE` queries used in features like global search.

## Query Description: [This operation enables a standard PostgreSQL extension required for performance optimizations. It is a safe, non-destructive operation and has no impact on existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Enables the `pg_trgm` extension within the `extensions` schema.

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Admin/migration privileges required to run]

## Performance Impact:
- Indexes: [Enables creation of GIN/GiST indexes using trigram ops]
- Triggers: [None]
- Estimated Impact: [Positive. Allows for significant performance improvements on text search queries.]
*/
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

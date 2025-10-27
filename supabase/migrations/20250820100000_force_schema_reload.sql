/*
# [Schema Cache Invalidation]
This is a maintenance operation to force a reload of the database schema cache. It adds a descriptive comment to the 'orders' table, which is a safe, non-destructive action. This should resolve any "column not found in schema cache" errors that may persist after a migration.

## Query Description:
- Adds a comment to the `orders` table.
- This operation does not modify data or table structure.
- It is a safe and reversible action.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects table: `public.orders`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a metadata-only change.
*/
COMMENT ON TABLE public.orders IS 'Tracks individual patient referrals and their progress through the workflow. Cache refresh 2025-08-20.';

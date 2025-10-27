/*
# [Data Integrity] Set Default for `is_archived`

This migration fixes a critical data visibility issue where newly created referrals were not appearing in the main list.

## Query Description:
- **UPDATE:** It finds all records in the `orders` table where the `is_archived` flag is `NULL` and sets them to `false`. This makes all existing "invisible" referrals appear correctly.
- **ALTER TABLE:** It modifies the `orders` table to ensure that any new referral created in the future will automatically have `is_archived` set to `false` by default.

This is a safe, non-destructive operation that corrects data integrity and prevents future data from becoming hidden.

## Metadata:
- Schema-Category: "Data"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (though not recommended)

## Structure Details:
- Table: `public.orders`
- Column: `is_archived`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Low. The `UPDATE` will run once on existing data. The `ALTER` is a metadata change.
*/

-- Step 1: Correct existing records that have a NULL is_archived status.
UPDATE public.orders
SET is_archived = false
WHERE is_archived IS NULL;

-- Step 2: Set a default value for the column to prevent this issue in the future.
ALTER TABLE public.orders
ALTER COLUMN is_archived SET DEFAULT false;

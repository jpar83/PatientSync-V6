/*
# Add User Archiving Capability
This migration adds an `archived_at` timestamp column to the `profiles` table, enabling soft-deletion of users.

## Query Description:
This operation adds a new nullable `archived_at` column to the `profiles` table. It is non-destructive and will not affect existing data. Setting a timestamp in this column will mark a user as archived.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The column can be dropped)

## Structure Details:
- Table: `public.profiles`
- Column Added: `archived_at` (TIMESTAMPTZ)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None for this migration. Application logic will control setting this field.

## Performance Impact:
- Indexes: None added.
- Triggers: None added.
- Estimated Impact: Negligible. Adding a nullable column is a fast metadata change.
*/
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

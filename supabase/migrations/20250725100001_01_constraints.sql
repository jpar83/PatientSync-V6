/*
# [Schema] Add Import-Related Fields and Constraints
This migration adds columns to the `patients` table to support the new import logic and data tracking. It also adds a unique, case-insensitive constraint on the email field to prevent duplicate patient entries.

## Query Description:
- Adds `updated_hash` (text) to store a hash of the patient record for quick change detection.
- Adds `source` (text) to track where the patient data originated from (e.g., manual entry, import file).
- Adds `last_imported_at` (timestamptz) to log the last time the record was touched by an import.
- Creates a unique index on the lowercased `email` to enforce case-insensitive uniqueness. This is a critical data integrity measure.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `patients`
- Columns Added: `updated_hash`, `source`, `last_imported_at`
- Indexes Added: `idx_patients_email_unique_case_insensitive`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Adds a new unique index, which will slightly slow down inserts/updates on the `patients` table but significantly speed up email lookups.
- Triggers: None
- Estimated Impact: Low negative impact on writes, high positive impact on lookups and data integrity.
*/

-- Add columns for import tracking and change detection
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_hash TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_imported_at TIMESTAMPTZ;

-- Enforce case-insensitive uniqueness for emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_email_unique_case_insensitive ON public.patients (lower(email));

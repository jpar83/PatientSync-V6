/*
# [Schema] Add Constraints and Tracking Columns
This migration enhances the `patients` table by adding columns for data import tracking and creates a unique index on the email field to prevent duplicate entries.

## Query Description: [This operation alters the 'patients' table to improve data integrity and tracking. It adds three new columns: 'updated_hash' (for detecting changes), 'source' (for tracking import origins), and 'last_imported_at' (for timestamping imports). It also enforces email uniqueness. No existing data will be lost, but this may cause future imports of duplicate emails to fail, which is the intended behavior.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.patients`
- Columns Added: `updated_hash`, `source`, `last_imported_at`
- Indexes Added: `patients_email_unique_idx`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Adds a unique index, which may slightly slow down inserts/updates on `patients` but will speed up email lookups.
- Triggers: None
- Estimated Impact: Low. The primary impact is on data import logic, making it more robust.
*/

-- Enable pg_trgm extension for fuzzy string matching, used by other functions.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Add columns for import tracking and hashing to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_hash TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_imported_at TIMESTAMPTZ;

-- Add a unique index on the lowercase email to prevent duplicates, ensuring data integrity.
CREATE UNIQUE INDEX IF NOT EXISTS patients_email_unique_idx ON public.patients (lower(email));

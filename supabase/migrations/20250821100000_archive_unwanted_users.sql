/*
# [Operation Name]
Bulk Archive Users

## Query Description: [This operation will archive all user profiles except for a predefined list of essential users ('parrishjeff83@gmail.com', 'segalk4664@gmail.com', 'ksegal@patientschoicemedical.com'). Archiving a user deactivates their account within the application but does not permanently delete their data, making this a safe and reversible action.]

## Metadata:
- Schema-Category: "Data"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: public.profiles
- Column: archived_at
- Action: UPDATE

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Assumes the user running this has appropriate permissions.

## Performance Impact:
- Indexes: No change
- Triggers: No change
- Estimated Impact: Low. This is a single UPDATE statement on the profiles table, which is typically small.
*/

UPDATE public.profiles
SET
  archived_at = NOW()
WHERE
  email NOT IN (
    'parrishjeff83@gmail.com',
    'segalk4664@gmail.com',
    'ksegal@patientschoicemedical.com'
  );

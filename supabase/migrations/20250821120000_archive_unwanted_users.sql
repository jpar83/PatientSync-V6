/*
# [Data Operation] Archive Unwanted User Profiles
This operation archives user profiles that are not in the specified keep-list. Archived users will not be able to log in and will be hidden from most user lists in the application. This is a data modification action.

## Query Description: [This operation will update the 'profiles' table to set an 'archived_at' timestamp for all users except for a predefined list of administrators. This is a non-destructive way to disable user accounts. It is recommended to back up the 'profiles' table before running this script.]

## Metadata:
- Schema-Category: ["Data"]
- Impact-Level: ["Medium"]
- Requires-Backup: [true]
- Reversible: [true]

## Structure Details:
- Table: public.profiles
- Columns Affected: archived_at

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Admin]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Low. The query will run on a small number of user profiles.]
*/
UPDATE public.profiles
SET archived_at = now()
WHERE email NOT IN (
  'parrishjeff83@gmail.com',
  'segalk4664@gmail.com',
  'ksegal@patientschoicemedical.com'
);

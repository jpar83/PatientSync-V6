/*
# [Operation Name]
Promote User to Admin

## Query Description:
This operation updates the role of a specific user in the 'profiles' table to 'admin'. This grants the user administrative privileges within the application. This change is safe and does not affect other user data.

## Metadata:
- Schema-Category: "Data"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: public.profiles
- Column: role
- Condition: WHERE email = 'parrishjeff83@gmail.com'

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: This script must be run by a user with sufficient privileges to update the 'profiles' table.

## Performance Impact:
- Indexes: Affects a single row, likely using an index on the email column.
- Triggers: No new triggers.
- Estimated Impact: Negligible performance impact.
*/

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'parrishjeff83@gmail.com';

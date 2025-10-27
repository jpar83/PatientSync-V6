/*
# [Fix] Create and Backfill User Profiles
This migration ensures that every user in `auth.users` has a corresponding entry in `public.profiles`, which is required for creating records like patient notes. It fixes the "violates foreign key constraint" error for existing users and prevents it for new users.

## Query Description:
1.  **`handle_new_user` function & trigger**: This automatically creates a `profiles` entry whenever a new user signs up via Supabase Auth.
2.  **Backfill `profiles`**: This `INSERT` statement finds all users in `auth.users` who do not have a profile in `public.profiles` and creates one for them. This is a one-time fix for existing users.

This operation is safe and will not affect existing data. It only adds missing profile records.

## Metadata:
- Schema-Category: ["Structural", "Data"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Adds a trigger `on_auth_user_created` to `auth.users`.
- Inserts data into `public.profiles`.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: The trigger runs with `DEFINER` rights to insert into `public.profiles`.

## Performance Impact:
- Indexes: None
- Triggers: Adds one `AFTER INSERT` trigger on `auth.users`, which has a negligible performance impact on sign-ups.
- Estimated Impact: Low.
*/

-- Function to create a public.profiles entry for a new user in auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop trigger if it exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger to run the function after a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for any existing users who are missing one.
-- This will fix the issue for the current user and any others who signed up
-- before the trigger was in place.
insert into public.profiles (id, email, full_name, avatar_url)
select
    id,
    email,
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url'
from
    auth.users
where
    id not in (select id from public.profiles);

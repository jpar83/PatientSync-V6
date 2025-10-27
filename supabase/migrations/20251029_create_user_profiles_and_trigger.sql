/*
  # [Function] handle_new_user
  [This function creates a profile in the `public.profiles` table when a new user signs up in `auth.users`.]

  ## Query Description: [This operation creates a function and a trigger to automate user profile creation. It ensures that every user in the authentication system has a corresponding profile record, which is necessary for features like adding notes. It also backfills profiles for any existing users who are missing one. This is a safe, non-destructive operation.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Creates function: `public.handle_new_user()`
  - Creates trigger: `on_auth_user_created` on `auth.users`
  - Inserts data into: `public.profiles`
  
  ## Security Implications:
  - RLS Status: [N/A for function/trigger]
  - Policy Changes: [No]
  - Auth Requirements: [The function runs with definer rights to access `auth.users`.]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [Adds one trigger to `auth.users` on insert.]
  - Estimated Impact: [Negligible. This trigger runs only once per user sign-up.]
*/

-- Function to create a profile for a new user
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
  );
  return new;
end;
$$;

-- Trigger to call the function when a new user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for existing users who might be missing one
insert into public.profiles (id, email, full_name, avatar_url)
select
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

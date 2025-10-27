/*
          # Create User Profiles and Trigger
          This migration ensures all users have a profile and sets up a trigger for automatic profile creation.

          ## Query Description: This script first inserts profiles for any existing users in `auth.users` who do not have one. Then, it creates a trigger that automatically creates a new profile in `public.profiles` whenever a new user is created in `auth.users`. This is critical for maintaining data integrity, especially for foreign key constraints like `patient_notes.created_by`.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - Table: `public.profiles`
          - Trigger: `on_auth_user_created` on `auth.users`
          
          ## Security Implications:
          - RLS Status: Not directly affected, but enables RLS on other tables to work correctly.
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: Adds a new trigger to `auth.users`.
          - Estimated Impact: Negligible impact on user creation performance.
          */
-- 1. Backfill profiles for existing users
insert into public.profiles (id, email, full_name, avatar_url)
select
    id,
    raw_user_meta_data->>'email' as email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'avatar_url' as avatar_url
from auth.users
where id not in (select id from public.profiles);

-- 2. Create the function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'email',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- 3. Create the trigger to call the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

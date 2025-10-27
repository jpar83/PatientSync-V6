/*
# [Marketing Address and Convert]
This migration extends the marketing_leads table with address fields and a function to compute the full address.

## Query Description: [Adds 'suite' and 'full_address' columns to marketing_leads, creates a function to build the full address, backfills existing data, and sets up a trigger to keep it in sync. No data loss is expected.]

## Metadata:
- Schema-Category: ["Structural", "Data"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- marketing_leads: add column `suite`, `full_address`
- functions: add `build_full_address`, `tg_refresh_full_address`
- triggers: add `trg_leads_full_address`

## Security Implications:
- RLS Status: [No change]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [Added]
- Estimated Impact: [Low impact on insert/update operations for marketing_leads.]
*/

-- Add Suite + full_address
alter table public.marketing_leads
  add column if not exists suite text,
  add column if not exists full_address text;

-- Backfill full_address (street + suite + city/state/zip)
create or replace function public.build_full_address(s text, su text, c text, st text, z text)
returns text language sql immutable as
$$ select trim(both ' ' from
  coalesce(s,'') || case when su is not null and su <> '' then ' '||su else '' end ||
  case when c is not null then ', '||c else '' end ||
  case when st is not null then ', '||st else '' end ||
  case when z is not null then ' '||z else '' end ); $$;

update public.marketing_leads
set full_address = public.build_full_address(street, suite, city, state, zip)
where full_address is null;

-- Keep full_address in sync on change
drop trigger if exists trg_leads_full_address on public.marketing_leads;
create or replace function public.tg_refresh_full_address()
returns trigger language plpgsql as $$
begin
  new.full_address := public.build_full_address(new.street, new.suite, new.city, new.state, new.zip);
  return new;
end $$;
create trigger trg_leads_full_address
before insert or update of street, suite, city, state, zip on public.marketing_leads
for each row execute procedure public.tg_refresh_full_address();

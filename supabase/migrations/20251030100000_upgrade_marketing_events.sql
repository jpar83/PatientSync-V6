-- Event type enum
do $$ begin
  create type public.marketing_event_type_enum as enum
  ('In-Service','Repair','Training','Community','Meeting','Delivery','Pickup','Other');
exception when duplicate_object then null; end $$;

-- Ensure status enum exists (from prior work)
do $$ begin
  create type public.in_service_status_enum as enum ('Planned','Confirmed','Done','Cancelled');
exception when duplicate_object then null; end $$;

-- Extend table (keep name to avoid breaking code)
alter table public.marketing_in_services
  add column if not exists event_type public.marketing_event_type_enum default 'In-Service',
  add column if not exists topic text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists location text,
  add column if not exists notes text,
  add column if not exists assigned_to uuid references public.profiles(id),
  add column if not exists attendees int;

-- Helpful indexes
create index if not exists idx_mis_start on public.marketing_in_services(start_at);
create index if not exists idx_mis_event_type on public.marketing_in_services(event_type);


-- Auto-touchpoint rules (safe helpers):

-- When an event is created, log a "Scheduled" touchpoint.
create or replace function public.log_touchpoint_for_event()
returns trigger language plpgsql as $$
begin
  insert into public.marketing_touchpoints(lead_id, occurred_at, type, outcome, notes, user_id)
  values (new.lead_id, coalesce(new.start_at, now()), 'In-Service', 'Scheduled',
          coalesce('Event: '||new.event_type||' — '||coalesce(new.topic,''),''), new.user_id);
  return new;
end $$;

drop trigger if exists trg_event_scheduled on public.marketing_in_services;
create trigger trg_event_scheduled
after insert on public.marketing_in_services
for each row execute procedure public.log_touchpoint_for_event();

-- When status flips to Done, log a Done touchpoint and suggest follow-up.
create or replace function public.log_touchpoint_on_done()
returns trigger language plpgsql as $$
begin
  if (tg_op='UPDATE' and new.status='Done' and old.status is distinct from 'Done') then
    insert into public.marketing_touchpoints(lead_id, occurred_at, type, outcome, follow_up_at, notes, user_id)
    values (new.lead_id, coalesce(new.end_at, now()), 'In-Service', 'Done',
            (now() + interval '3 days'),
            coalesce('Event: '||new.event_type||' completed.',''), new.user_id);
    update public.marketing_leads
       set next_action_at = least(coalesce(next_action_at, now() + interval '3 days'), now() + interval '3 days')
     where id = new.lead_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_event_done on public.marketing_in_services;
create trigger trg_event_done
after update of status on public.marketing_in_services
for each row execute procedure public.log_touchpoint_on_done();

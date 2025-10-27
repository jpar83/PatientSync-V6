-- This schema should be applied to your Supabase project
-- once it's connected.

-- Add columns to the orders table for tracking the last stage change
alter table orders add column if not exists last_stage_change timestamptz default now();
alter table orders add column if not exists last_stage_note text;

-- Create the workflow_history table for auditing changes
create table if not exists workflow_history(
 id uuid primary key default gen_random_uuid(),
 order_id uuid references orders(id) on delete cascade,
 previous_stage text,
 new_stage text,
 note text,
 changed_by text,
 changed_at timestamptz default now()
);

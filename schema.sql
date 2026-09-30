create table if not exists support_tickets (
  ticket_id text primary key,
  created_at date not null,
  assigned_team text,
  agent_id text,
  category text,
  refund_reason_code text,
  customer_message text,
  agent_notes text,
  source_system text,
  refund_amount_inr numeric(12,2) default 0,
  created_at_timestamp timestamptz default now()
);

create index if not exists support_tickets_created_at_idx on support_tickets (created_at desc);
create index if not exists support_tickets_category_idx on support_tickets (category);

-- Load data/tickets.csv with your preferred PostgreSQL client, then the app
-- automatically reads Neon when DATABASE_URL is present.

-- Example psql import:
-- \copy support_tickets(ticket_id,created_at,assigned_team,agent_id,category,refund_reason_code,customer_message,agent_notes,source_system,refund_amount_inr) from 'data/tickets.csv' with (format csv, header true, null '');

-- Optional upsert for repeated imports:
-- \copy support_tickets(ticket_id,created_at,assigned_team,agent_id,category,refund_reason_code,customer_message,agent_notes,source_system,refund_amount_inr) from 'data/tickets.csv' with (format csv, header true, null '');

-- Set DATABASE_URL in .env.local and restart the app.
-- The dashboard remains fully usable from data/tickets.csv when it is absent.

alter table support_tickets enable row level security;
-- This internal analytics table is accessed by the server with DATABASE_URL.
-- Add application-specific policies before exposing it to browser-side clients.

create or replace view support_ticket_analytics as
select ticket_id, created_at, assigned_team, agent_id, category, refund_reason_code, source_system, refund_amount_inr
from support_tickets;

-- Verify import:
-- select count(*) from support_tickets;
-- select min(created_at), max(created_at) from support_tickets;
-- select sum(refund_amount_inr) from support_tickets;

-- Note: if RLS is enabled on a direct Postgres role, grant the server role
-- access or remove the RLS line for this server-only deployment.

-- Recommended .env.local:
-- DATABASE_URL=postgresql://user:password@host/db?sslmode=require
--
-- Never commit .env.local or credentials.

-- The app's current query expects these columns:
-- ticket_id, created_at, assigned_team, agent_id, category,
-- refund_reason_code, customer_message, agent_notes, source_system,
-- refund_amount_inr

-- End of schema.

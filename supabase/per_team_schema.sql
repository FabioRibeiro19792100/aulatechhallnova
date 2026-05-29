begin;

create table if not exists public.event_state (
  event_id    text primary key,
  payload     jsonb not null default '{}'::jsonb,
  version     bigint not null default 1,
  updated_at  timestamptz not null default timezone('utc', now())
);

create table if not exists public.team_state (
  event_id    text not null,
  team_idx    int  not null,
  payload     jsonb not null default '{}'::jsonb,
  version     bigint not null default 1,
  updated_at  timestamptz not null default timezone('utc', now()),
  primary key (event_id, team_idx)
);

create table if not exists public.team_presence (
  event_id      text not null,
  team_idx      int  not null,
  member_name   text not null default '',
  last_seen_at  timestamptz not null default timezone('utc', now()),
  primary key (event_id, team_idx)
);

create table if not exists public.executions (
  id            text primary key,
  event_id      text not null,
  team_idx      int  not null,
  mission_id    text not null,
  kind          text not null default 'chat',
  payload       jsonb not null default '{}'::jsonb,
  tokens        jsonb not null default '{}'::jsonb,
  custo         numeric,
  created_at    timestamptz not null default timezone('utc', now())
);

create index if not exists executions_slot on public.executions (event_id, team_idx, mission_id, created_at desc);
create index if not exists executions_event on public.executions (event_id, created_at desc);

create table if not exists public.token_operational_logs (
  id          bigserial primary key,
  event_id    text not null,
  team_idx    int,
  mission_id  text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists token_logs_event on public.token_operational_logs (event_id, team_idx, created_at desc);

create table if not exists public.help_requests (
  id          text primary key,
  event_id    text not null,
  team_idx    int  not null,
  mission_id  text,
  status      text not null default 'open',
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

create index if not exists help_requests_open on public.help_requests (event_id, status, created_at desc);
create index if not exists help_requests_team on public.help_requests (event_id, team_idx);

alter table public.event_state              enable row level security;
alter table public.team_state               enable row level security;
alter table public.team_presence            enable row level security;
alter table public.executions               enable row level security;
alter table public.token_operational_logs   enable row level security;
alter table public.help_requests            enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['event_state','team_state','team_presence','executions','token_operational_logs','help_requests'] loop
    execute format('drop policy if exists %I_select_anon on public.%I', t, t);
    execute format('drop policy if exists %I_insert_anon on public.%I', t, t);
    execute format('drop policy if exists %I_update_anon on public.%I', t, t);
    execute format('create policy %I_select_anon on public.%I for select to anon using (true)', t, t);
    execute format('create policy %I_insert_anon on public.%I for insert to anon with check (true)', t, t);
    execute format('create policy %I_update_anon on public.%I for update to anon using (true) with check (true)', t, t);
  end loop;
end $$;

commit;

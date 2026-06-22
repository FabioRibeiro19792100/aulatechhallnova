-- Migrate: habilitar realtime na tabela app_state
-- Execute este script no SQL Editor do Supabase para corrigir:
--   - Cronômetro não chegando para o aluno
--   - Transmissão de tela não funcionando
--   - Fila de ajuda sem atualização em tempo real
--
-- É seguro rodar mais de uma vez (o IF NOT EXISTS protege a tabela).
-- A linha do publication não tem IF NOT EXISTS, mas o Supabase ignora
-- silenciosamente se a tabela já foi adicionada.

-- 1. Garante que a tabela existe (idempotente)
create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

-- 2. Garante RLS ativa
alter table public.app_state enable row level security;

-- 3. Garante as políticas (cria só se não existirem)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'app_state'
      and policyname = 'app_state_select_anon'
  ) then
    create policy "app_state_select_anon"
    on public.app_state for select to anon using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'app_state'
      and policyname = 'app_state_insert_anon'
  ) then
    create policy "app_state_insert_anon"
    on public.app_state for insert to anon with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'app_state'
      and policyname = 'app_state_update_anon'
  ) then
    create policy "app_state_update_anon"
    on public.app_state for update to anon
    using (true) with check (true);
  end if;
end $$;

-- 4. Habilita realtime (esta é a linha crítica que provavelmente falta)
alter publication supabase_realtime add table app_state;

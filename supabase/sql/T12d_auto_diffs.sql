-- T12d_auto_diffs.sql
-- Adiciona automacao de comparacao apos a geracao de um snapshot

-- 1) Tabela de execucoes de auto-diff
create table if not exists public.snapshot_diff_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('manual', 'job', 'cron')),
  snapshot_id uuid not null references public.public_snapshots(id) on delete cascade,
  previous_snapshot_id uuid references public.public_snapshots(id) on delete set null,
  diff_id uuid references public.public_snapshot_diffs(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'skipped', 'error')),
  message text,
  created_at timestamptz not null default now()
);

-- Indices para otimizacao
create index if not exists idx_snapshot_diff_runs_snapshot_id on public.snapshot_diff_runs(snapshot_id);
create index if not exists idx_snapshot_diff_runs_previous_snapshot_id on public.snapshot_diff_runs(previous_snapshot_id);
create index if not exists idx_snapshot_diff_runs_status on public.snapshot_diff_runs(status);

alter table public.snapshot_diff_runs enable row level security;

-- Permissoes (moderators e admins)
create policy "Admins e moderators podem ler snapshot_diff_runs"
  on public.snapshot_diff_runs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- O frontend só insere e atualiza através de RPC bypass RLS para jobs, mas
-- manteremos o padrão de segurança RLS na tabela.

-- 2) RPC para encontrar snapshot anterior compativel
create or replace function public.find_previous_compatible_snapshot(
  in_snapshot_id uuid
)
returns table (
  snapshot_id uuid,
  kind text,
  days integer,
  neighborhood text,
  snapshot_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_snapshot record;
begin
  -- Busca os detalhes do snapshot atual
  select * into v_current_snapshot
  from public.public_snapshots
  where id = in_snapshot_id;

  if not found then
    return;
  end if;

  return query
  select 
    ps.id as snapshot_id,
    ps.kind::text,
    ps.days,
    ps.neighborhood,
    ps.snapshot_at
  from public.public_snapshots ps
  where 
    -- Mesmo tipo de dado e janela de tempo
    ps.kind = v_current_snapshot.kind
    and ps.days = v_current_snapshot.days
    -- Tratamento adequado para null no neighborhood
    and (ps.neighborhood is not distinct from v_current_snapshot.neighborhood)
    -- Deve ser estritamente anterior ao nosso
    and ps.snapshot_at < v_current_snapshot.snapshot_at
    -- Apenas se for publico
    and ps.is_public = true
    -- Nao compara consigo mesmo
    and ps.id != in_snapshot_id
  order by ps.snapshot_at desc
  limit 1;
end;
$$;

-- 3) RPC principal para criar auto-diff para um snapshot selecionado
create or replace function public.create_auto_diff_for_snapshot(
  in_snapshot_id uuid,
  in_source text default 'manual'
)
returns table (
  ok boolean,
  message text,
  status text,
  previous_snapshot_id uuid,
  diff_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_prev_snapshot_id uuid;
  v_diff_id uuid;
  v_diff_result record;
  v_existing_diff record;
  v_is_authorized boolean := false;
begin
  -- 1) Checagem de autorizacao (auth.uid() via server ou bypassed por service role key)
  if current_setting('request.jwt.claims', true) is null then
    -- bypass RLS de root ou service_role, allowed.
    v_is_authorized := true;
  else
    select exists (
      select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')
    ) into v_is_authorized;
  end if;

  if not v_is_authorized then
    return query select false, 'Não autorizado a criar diffs automáticos', 'error', null::uuid, null::uuid;
    return;
  end if;

  -- 2) Cria a execucao em status running
  insert into public.snapshot_diff_runs(source, snapshot_id, status)
  values (in_source, in_snapshot_id, 'running')
  returning id into v_run_id;

  -- 3) Busca anterior
  select fps.snapshot_id
  into v_prev_snapshot_id
  from public.find_previous_compatible_snapshot(in_snapshot_id) fps;

  if v_prev_snapshot_id is null then
    update public.snapshot_diff_runs
    set status = 'skipped',
        finished_at = now(),
        message = 'Nenhum snapshot anterior compatível encontrado'
    where id = v_run_id;

    return query select true, 'Nenhum snapshot anterior compatível encontrado', 'skipped', null::uuid, null::uuid;
    return;
  end if;

  -- Update do ID anterior
  update public.snapshot_diff_runs
  set previous_snapshot_id = v_prev_snapshot_id
  where id = v_run_id;

  -- 4) Verifica se ja existe public_snapshot_diff para essa dupla
  select psd.id into v_diff_id
  from public.public_snapshot_diffs psd
  where psd.from_snapshot_id = v_prev_snapshot_id
    and psd.to_snapshot_id = in_snapshot_id
  limit 1;

  if v_diff_id is not null then
    update public.snapshot_diff_runs
    set status = 'skipped',
        finished_at = now(),
        message = 'Diff já existe para estes snapshots',
        diff_id = v_diff_id
    where id = v_run_id;

    return query select true, 'Diff já existe para estes snapshots', 'skipped', v_prev_snapshot_id, v_diff_id;
    return;
  end if;

  -- 5) Criar diff
  begin
    select * into v_diff_result 
    from public.create_public_snapshot_diff(v_prev_snapshot_id, in_snapshot_id, null);

    if v_diff_result.ok then
      update public.snapshot_diff_runs
      set status = 'success',
          finished_at = now(),
          message = 'Diff gerado automaticamente com sucesso',
          diff_id = v_diff_result.diff_id
      where id = v_run_id;

      return query select true, 'Diff gerado com sucesso', 'success', v_prev_snapshot_id, v_diff_result.diff_id;
    else
      update public.snapshot_diff_runs
      set status = 'error',
          finished_at = now(),
          message = coalesce(v_diff_result.message, 'Erro interno na RPC de diff')
      where id = v_run_id;

      return query select false, coalesce(v_diff_result.message, 'Erro interno na RPC de diff'), 'error', v_prev_snapshot_id, null::uuid;
    end if;
  exception when others then
    update public.snapshot_diff_runs
    set status = 'error',
        finished_at = now(),
        message = substr(sqlerrm, 1, 1000)
    where id = v_run_id;

    return query select false, substr(sqlerrm, 1, 1000), 'error', v_prev_snapshot_id, null::uuid;
  end;
end;
$$;

-- 4) RPC Listagem
create or replace function public.list_snapshot_diff_runs(
  in_limit integer default 50
)
returns table (
  id uuid,
  source text,
  snapshot_id uuid,
  previous_snapshot_id uuid,
  diff_id uuid,
  started_at timestamptz,
  finished_at timestamptz,
  status text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_authorized boolean := false;
begin
  select exists (
    select 1 from public.profiles where profiles.id = auth.uid() and role in ('admin', 'moderator')
  ) into v_is_authorized;

  if not v_is_authorized then
    raise exception 'Acesso negado. Apenas admin e moderator.';
  end if;

  return query
  select 
    r.id,
    r.source,
    r.snapshot_id,
    r.previous_snapshot_id,
    r.diff_id,
    r.started_at,
    r.finished_at,
    r.status,
    r.message
  from public.snapshot_diff_runs r
  order by r.started_at desc
  limit in_limit;
end;
$$;

-- T11b: Materialized Snapshots & Frozen Diffs
-- Snapshots "fotografados" congelados em data/hora para compartilhamento e comparação entre dois estados

-- ========== TABELA: public_snapshots ==========
-- Armazena snapshots materializados de transparência e território
create table if not exists public.public_snapshots (
  id uuid primary key default gen_random_uuid(),
  kind text not null,  -- 'transparency' | 'territory'
  title text,           -- rótulo opcional
  days integer not null,  -- janela usada: 7, 30, 90, 365
  neighborhood text,    -- opcional, bairro específico para territory
  snapshot_at timestamptz not null default now(),  -- quando foi tirado
  data jsonb not null,  -- dados agregados (público, enxuto, estável)
  source_version text,  -- versão do schema, para auditar evolução
  created_by uuid references auth.users(id) on delete set null,  -- moderador/admin que criou
  is_public boolean not null default true,  -- visibilidade
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'public_snapshots_kind_check'
      and conrelid = 'public.public_snapshots'::regclass
  ) then
    alter table public.public_snapshots
      add constraint public_snapshots_kind_check check (kind in ('transparency', 'territory'));
  end if;
end $$;

create index if not exists idx_public_snapshots_kind_is_public on public.public_snapshots(kind, is_public, created_at desc);
create index if not exists idx_public_snapshots_neighborhood on public.public_snapshots(neighborhood, is_public) where neighborhood is not null;
create index if not exists idx_public_snapshots_created_by on public.public_snapshots(created_by) where created_by is not null;

-- ========== TABELA: public_snapshot_diffs ==========
-- Armazena diffs congelados entre dois snapshots
create table if not exists public.public_snapshot_diffs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,  -- 'transparency' | 'territory', ambos devem coincidir
  from_snapshot_id uuid not null references public.public_snapshots(id) on delete cascade,
  to_snapshot_id uuid not null references public.public_snapshots(id) on delete cascade,
  title text,  -- rótulo opcional
  diff_data jsonb not null,  -- comparação entre dois snapshots (período A vs período B)
  created_by uuid references auth.users(id) on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint diff_snapshots_same_kind check (kind in ('transparency', 'territory')),
  constraint diff_snapshots_different check (from_snapshot_id != to_snapshot_id)
);

create index if not exists idx_public_snapshot_diffs_kind_is_public on public.public_snapshot_diffs(kind, is_public, created_at desc);
create index if not exists idx_public_snapshot_diffs_from on public.public_snapshot_diffs(from_snapshot_id);
create index if not exists idx_public_snapshot_diffs_to on public.public_snapshot_diffs(to_snapshot_id);
create index if not exists idx_public_snapshot_diffs_created_by on public.public_snapshot_diffs(created_by);

-- ========== HELPER: is_moderator() ==========
-- Retorna true se o usuário atual é moderador ou admin
create or replace function public.is_moderator()
returns boolean
security definer
set search_path = public
language plpgsql
as $$
declare
  v_uid uuid;
  v_role text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return false;
  end if;

  select p.role
    into v_role
  from public.profiles p
  where p.id = v_uid;

  if v_role in ('moderator', 'admin') then
    return true;
  end if;

  return coalesce((auth.jwt() ->> 'user_role')::text in ('moderator', 'admin'), false);
end;
$$;

-- ========== RPC: create_public_snapshot ==========
-- Cria um snapshot materializado de transparência ou território
-- Requer auth.uid() não-null e role moderator/admin
create or replace function public.create_public_snapshot(
  in_kind text,
  in_days integer default 30,
  in_neighborhood text default null,
  in_title text default null
)
returns table (
  ok boolean,
  message text,
  snapshot_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_snapshot_id uuid;
  v_data jsonb;
  v_summary jsonb;
begin
  v_uid := auth.uid();
  
  -- Validação: autenticado
  if v_uid is null then
    return query select false, 'Nao autenticado', null::uuid;
    return;
  end if;
  
  -- Validação: moderator/admin
  if not is_moderator() then
    return query select false, 'Sem permissao. Requer role moderator ou admin', null::uuid;
    return;
  end if;
  
  -- Validação: kind válido
  if in_kind not in ('transparency', 'territory') then
    return query select false, format('Kind invalido: %L. Use transparency ou territory', in_kind), null::uuid;
    return;
  end if;
  
  -- Validação: days válido
  if in_days not in (7, 30, 90, 365) then
    return query select false, format('Days invalido: %L. Use 7, 30, 90 ou 365', in_days), null::uuid;
    return;
  end if;
  
  -- Monta snapshot_data conforme kind
  if in_kind = 'transparency' then
    -- Snapshots de transparência: sumário geral + breakdown por condição
    v_summary := jsonb_build_object(
      'kind', 'transparency',
      'days', in_days,
      'snapshot_at', now()::text,
      'description', format('Transparencia para ultimos %s dias', in_days)
    );
    
    v_data := jsonb_build_object(
      'metadata', v_summary,
      'summary', jsonb_build_object(
        'total_published', 0,
        'total_verified', 0,
        'total_blocked', 0
      ),
      'note', 'Snapshot materializado. Dados detalhados preenchidos ao aplicar SQL T08+ no Supabase.'
    );
    
  elsif in_kind = 'territory' then
    -- Snapshots de território: por bairro, priority scores, etc.
    v_summary := jsonb_build_object(
      'kind', 'territory',
      'days', in_days,
      'neighborhood', in_neighborhood,
      'snapshot_at', now()::text,
      'description', case when in_neighborhood is not null
        then format('Territorio para bairro %L, ultimos %s dias', in_neighborhood, in_days)
        else format('Territorio para todos os bairros, ultimos %s dias', in_days)
      end
    );
    
    v_data := jsonb_build_object(
      'metadata', v_summary,
      'summary', jsonb_build_object(
        'neighborhoods_with_issues', 0,
        'total_priority_score', 0
      ),
      'note', 'Snapshot materializado. Dados detalhados preenchidos ao aplicar SQL T09+ no Supabase.'
    );
  end if;
  
  -- Insere snapshot
  insert into public.public_snapshots (kind, title, days, neighborhood, snapshot_at, data, source_version, created_by, is_public)
  values (in_kind, in_title, in_days, in_neighborhood, now(), v_data, '1.0', v_uid, true)
  returning id into v_snapshot_id;
  
  return query select true, 'Snapshot criado com sucesso', v_snapshot_id;
end;
$$;

-- ========== RPC: list_public_snapshots ==========
-- Lista snapshots públicas com filtro opcional por kind
create or replace function public.list_public_snapshots(
  in_kind text default null,
  in_limit integer default 50
)
returns table (
  id uuid,
  kind text,
  title text,
  days integer,
  neighborhood text,
  snapshot_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.id,
    s.kind,
    s.title,
    s.days,
    s.neighborhood,
    s.snapshot_at,
    s.created_at
  from public.public_snapshots s
  where s.is_public = true
    and (in_kind is null or s.kind = in_kind)
  order by s.created_at desc
  limit in_limit;
$$;

-- ========== RPC: get_public_snapshot_by_id ==========
-- Retorna dados completos de um snapshot público
create or replace function public.get_public_snapshot_by_id(
  in_snapshot_id uuid
)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select
    jsonb_build_object(
      'id', s.id,
      'kind', s.kind,
      'title', s.title,
      'days', s.days,
      'neighborhood', s.neighborhood,
      'snapshot_at', s.snapshot_at,
      'created_at', s.created_at,
      'data', s.data
    )
  from public.public_snapshots s
  where s.id = in_snapshot_id
    and s.is_public = true;
$$;

-- ========== RPC: create_public_snapshot_diff ==========
-- Cria um diff congelado entre dois snapshots (A vs B)
-- Ambos devem ser do mesmo kind
create or replace function public.create_public_snapshot_diff(
  in_from_snapshot_id uuid,
  in_to_snapshot_id uuid,
  in_title text default null
)
returns table (
  ok boolean,
  message text,
  diff_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_diff_id uuid;
  v_from_kind text;
  v_to_kind text;
  v_diff_data jsonb;
begin
  v_uid := auth.uid();
  
  -- Validação: autenticado
  if v_uid is null then
    return query select false, 'Nao autenticado', null::uuid;
    return;
  end if;
  
  -- Validação: moderator/admin
  if not is_moderator() then
    return query select false, 'Sem permissao. Requer role moderator ou admin', null::uuid;
    return;
  end if;
  
  -- Recupera kinds
  select s.kind into v_from_kind from public.public_snapshots s where s.id = in_from_snapshot_id;
  select s.kind into v_to_kind from public.public_snapshots s where s.id = in_to_snapshot_id;
  
  -- Validação: snapshots existem
  if v_from_kind is null or v_to_kind is null then
    return query select false, 'Um ou ambos snapshots nao encontrados', null::uuid;
    return;
  end if;
  
  -- Validação: mesmo kind
  if v_from_kind != v_to_kind then
    return query select false, format('Snapshots de kinds diferentes. De %L para %L', v_from_kind, v_to_kind), null::uuid;
    return;
  end if;
  
  -- Validação: snapshots diferentes
  if in_from_snapshot_id = in_to_snapshot_id then
    return query select false, 'Snapshots sao iguais. Use IDs diferentes', null::uuid;
    return;
  end if;
  
  -- Monta diff_data. Por enquanto, apenas metadata e estrutura.
  -- O preenchimento real depende de T08+ SQL aplicado.
  v_diff_data := jsonb_build_object(
    'kind', v_from_kind,
    'from_snapshot_id', in_from_snapshot_id,
    'to_snapshot_id', in_to_snapshot_id,
    'created_at', now()::text,
    'comparison_note', 'Diff materializado. Compare dados em snapshots A vs B para diferencas concretas.',
    'summary', jsonb_build_object(
      'magnitude_delta', null,
      'direction', null
    )
  );
  
  -- Insere diff
  insert into public.public_snapshot_diffs (kind, from_snapshot_id, to_snapshot_id, title, diff_data, created_by, is_public)
  values (v_from_kind, in_from_snapshot_id, in_to_snapshot_id, in_title, v_diff_data, v_uid, true)
  returning id into v_diff_id;
  
  return query select true, 'Diff criado com sucesso', v_diff_id;
end;
$$;

-- ========== RPC: list_public_snapshot_diffs ==========
-- Lista diffs públicas com filtro opcional por kind
create or replace function public.list_public_snapshot_diffs(
  in_kind text default null,
  in_limit integer default 50
)
returns table (
  id uuid,
  kind text,
  title text,
  from_snapshot_id uuid,
  to_snapshot_id uuid,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    d.id,
    d.kind,
    d.title,
    d.from_snapshot_id,
    d.to_snapshot_id,
    d.created_at
  from public.public_snapshot_diffs d
  where d.is_public = true
    and (in_kind is null or d.kind = in_kind)
  order by d.created_at desc
  limit in_limit;
$$;

-- ========== RPC: get_public_snapshot_diff_by_id ==========
-- Retorna dados completos de um diff público
create or replace function public.get_public_snapshot_diff_by_id(
  in_diff_id uuid
)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select
    jsonb_build_object(
      'id', d.id,
      'kind', d.kind,
      'title', d.title,
      'from_snapshot_id', d.from_snapshot_id,
      'to_snapshot_id', d.to_snapshot_id,
      'created_at', d.created_at,
      'diff_data', d.diff_data
    )
  from public.public_snapshot_diffs d
  where d.id = in_diff_id
    and d.is_public = true;
$$;

-- ========== RLS POLICIES ==========

drop policy if exists "snapshot_read_public" on public.public_snapshots;
drop policy if exists "snapshot_create_moderator" on public.public_snapshots;
drop policy if exists "snapshot_diff_read_public" on public.public_snapshot_diffs;
drop policy if exists "snapshot_diff_create_moderator" on public.public_snapshot_diffs;

-- public_snapshots: Leitura pública para is_public = true
create policy "snapshot_read_public" on public.public_snapshots
  for select
  using (is_public = true);

-- public_snapshots: Moderator/admin podem criar
create policy "snapshot_create_moderator" on public.public_snapshots
  for insert
  with check (
    auth.uid() is not null
    and is_moderator()
  );

-- public_snapshot_diffs: Leitura pública para is_public = true
create policy "snapshot_diff_read_public" on public.public_snapshot_diffs
  for select
  using (is_public = true);

-- public_snapshot_diffs: Moderator/admin podem criar
create policy "snapshot_diff_create_moderator" on public.public_snapshot_diffs
  for insert
  with check (
    auth.uid() is not null
    and is_moderator()
  );

enable row level security on public.public_snapshots;
enable row level security on public.public_snapshot_diffs;

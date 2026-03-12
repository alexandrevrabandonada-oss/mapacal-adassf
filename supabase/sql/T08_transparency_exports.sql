-- T08: Transparencia e exportacoes com metricas agregadas
-- Aplicar via Supabase SQL Editor apos T02-T07

-- RPC publica para resumo agregado de transparencia
create or replace function public.get_transparency_summary(
  in_days integer default 30,
  in_neighborhood text default null
)
returns table (
  total_published bigint,
  total_verified bigint,
  total_pending bigint,
  total_needs_review bigint,
  total_hidden bigint
)
language sql
stable
as $$
  select
    coalesce(sum(case when sr.status = 'published' then 1 else 0 end), 0) as total_published,
    coalesce(sum(case when sr.status = 'published' and sv.user_id is not null then 1 else 0 end), 0) as total_verified,
    coalesce(sum(case when sr.status = 'pending' then 1 else 0 end), 0) as total_pending,
    coalesce(sum(case when sr.needs_review then 1 else 0 end), 0) as total_needs_review,
    coalesce(sum(case when sr.status = 'hidden' then 1 else 0 end), 0) as total_hidden
  from public.sidewalk_reports sr
  left join public.sidewalk_verifications sv
    on sv.report_id = sr.id
  where (now() - sr.created_at) <= (in_days || ' days')::interval
    and (in_neighborhood is null or sr.neighborhood ilike '%' || in_neighborhood || '%')
$$;

-- RPC publica para distribuicao por condicao
create or replace function public.get_condition_breakdown(
  in_days integer default 30
)
returns table (
  condition text,
  count_published bigint,
  count_pending bigint,
  count_total bigint
)
language sql
stable
as $$
  select
    sr.condition,
    coalesce(sum(case when sr.status = 'published' then 1 else 0 end), 0) as count_published,
    coalesce(sum(case when sr.status = 'pending' then 1 else 0 end), 0) as count_pending,
    count(sr.id)::bigint as count_total
  from public.sidewalk_reports sr
  where (now() - sr.created_at) <= (in_days || ' days')::interval
  group by sr.condition
  order by count_total desc
$$;

-- RPC publica para distribuicao por bairro (top 20)
create or replace function public.get_neighborhood_breakdown(
  in_days integer default 30,
  in_limit integer default 20
)
returns table (
  neighborhood text,
  count_published bigint,
  count_pending bigint,
  count_total bigint
)
language sql
stable
as $$
  select
    coalesce(sr.neighborhood, 'Sem informacao') as neighborhood,
    coalesce(sum(case when sr.status = 'published' then 1 else 0 end), 0) as count_published,
    coalesce(sum(case when sr.status = 'pending' then 1 else 0 end), 0) as count_pending,
    count(sr.id)::bigint as count_total
  from public.sidewalk_reports sr
  where (now() - sr.created_at) <= (in_days || ' days')::interval
  group by sr.neighborhood
  order by count_total desc
  limit in_limit
$$;

-- RPC publica para serie temporal: contagem por dia
create or replace function public.get_timeline_data(
  in_days integer default 30
)
returns table (
  report_date date,
  count_created bigint,
  count_published bigint
)
language sql
stable
as $$
  select
    sr.created_at::date as report_date,
    count(sr.id)::bigint as count_created,
    coalesce(sum(case when sr.status = 'published' then 1 else 0 end), 0) as count_published
  from public.sidewalk_reports sr
  where (now() - sr.created_at) <= (in_days || ' days')::interval
  group by sr.created_at::date
  order by report_date desc
$$;

-- RPC publica para export de reports (apenas published)
-- Retorna campos minimos para export, sem dados sensíveis
create or replace function public.export_published_reports(
  in_neighborhood text default null
)
returns table (
  id uuid,
  created_at timestamptz,
  condition text,
  neighborhood text,
  note text,
  lat double precision,
  lng double precision,
  verification_count integer,
  is_verified boolean,
  has_photo boolean
)
language sql
stable
as $$
  with reports_data as (
    select
      sr.id,
      sr.created_at,
      sr.condition,
      sr.neighborhood,
      sr.note,
      sr.lat,
      sr.lng,
      count(sv.user_id)::integer as verification_count,
      (sr.photo_private_path is not null) as has_photo
    from public.sidewalk_reports sr
    left join public.sidewalk_verifications sv
      on sv.report_id = sr.id
    where sr.status = 'published'
      and (in_neighborhood is null or sr.neighborhood ilike '%' || in_neighborhood || '%')
    group by sr.id, sr.created_at, sr.condition, sr.neighborhood, sr.note, sr.lat, sr.lng, sr.photo_private_path
  )
  select
    d.id,
    d.created_at,
    d.condition,
    d.neighborhood,
    d.note,
    d.lat,
    d.lng,
    d.verification_count,
    (d.verification_count > 0) as is_verified,
    d.has_photo
  from reports_data d
  order by d.created_at desc
$$;

-- Indices para melhor performance de agregacoes
create index if not exists idx_sidewalk_reports_status on public.sidewalk_reports(status);
create index if not exists idx_sidewalk_reports_neighborhood on public.sidewalk_reports(neighborhood);
create index if not exists idx_sidewalk_reports_created_date on public.sidewalk_reports(created_at::date);

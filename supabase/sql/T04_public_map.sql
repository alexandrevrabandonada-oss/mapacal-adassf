-- T04: camada publica do mapa com contagem de verificacoes
-- Aplicar via Supabase SQL Editor apos T02 e T03

create index if not exists idx_sidewalk_reports_status_created_at
  on public.sidewalk_reports(status, created_at desc);

create index if not exists idx_sidewalk_verifications_report_id
  on public.sidewalk_verifications(report_id);

-- RPC principal de listagem publica com filtros opcionais
create or replace function public.list_published_reports(
  in_condition text default null,
  in_neighborhood text default null,
  in_verified_only boolean default false
)
returns table (
  id uuid,
  created_at timestamptz,
  condition text,
  lat double precision,
  lng double precision,
  neighborhood text,
  note text,
  verification_count integer,
  is_verified boolean
)
language sql
stable
as $$
  with base as (
    select
      sr.id,
      sr.created_at,
      sr.condition,
      sr.lat,
      sr.lng,
      sr.neighborhood,
      sr.note,
      count(sv.user_id)::integer as verification_count
    from public.sidewalk_reports sr
    left join public.sidewalk_verifications sv
      on sv.report_id = sr.id
    where sr.status = 'published'
      and (in_condition is null or sr.condition = in_condition)
      and (
        in_neighborhood is null
        or sr.neighborhood ilike '%' || in_neighborhood || '%'
      )
    group by sr.id, sr.created_at, sr.condition, sr.lat, sr.lng, sr.neighborhood, sr.note
  )
  select
    b.id,
    b.created_at,
    b.condition,
    b.lat,
    b.lng,
    b.neighborhood,
    b.note,
    b.verification_count,
    (b.verification_count > 0) as is_verified
  from base b
  where (not in_verified_only) or (b.verification_count > 0)
  order by b.created_at desc;
$$;

-- RPC para detalhe publico por id
create or replace function public.get_published_report_by_id(in_id uuid)
returns table (
  id uuid,
  created_at timestamptz,
  condition text,
  lat double precision,
  lng double precision,
  neighborhood text,
  note text,
  verification_count integer,
  is_verified boolean
)
language sql
stable
as $$
  select
    lpr.id,
    lpr.created_at,
    lpr.condition,
    lpr.lat,
    lpr.lng,
    lpr.neighborhood,
    lpr.note,
    lpr.verification_count,
    lpr.is_verified
  from public.list_published_reports(null, null, false) lpr
  where lpr.id = in_id
  limit 1;
$$;

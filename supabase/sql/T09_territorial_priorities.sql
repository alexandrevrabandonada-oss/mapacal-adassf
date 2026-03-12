-- T09: Cobertura territorial e priorizacao publica por bairro
-- Aplicar via Supabase SQL Editor apos T02-T08

create or replace function public.get_neighborhood_priority_breakdown(
  in_days integer default 90
)
returns table (
  neighborhood text,
  total_published bigint,
  total_verified bigint,
  total_blocked bigint,
  total_bad bigint,
  total_good bigint,
  with_photo bigint,
  priority_score numeric
)
language sql
stable
as $$
  with per_report as (
    select
      sr.id,
      coalesce(nullif(trim(sr.neighborhood), ''), 'Sem informacao') as neighborhood,
      sr.condition,
      (sr.photo_private_path is not null) as has_photo,
      count(sv.user_id)::bigint as verification_count
    from public.sidewalk_reports sr
    left join public.sidewalk_verifications sv
      on sv.report_id = sr.id
    where sr.status = 'published'
      and sr.created_at >= now() - (in_days || ' days')::interval
    group by sr.id, sr.neighborhood, sr.condition, sr.photo_private_path
  )
  select
    pr.neighborhood,
    count(*)::bigint as total_published,
    coalesce(sum(case when pr.verification_count >= 2 then 1 else 0 end), 0)::bigint as total_verified,
    coalesce(sum(case when pr.condition = 'blocked' then 1 else 0 end), 0)::bigint as total_blocked,
    coalesce(sum(case when pr.condition = 'bad' then 1 else 0 end), 0)::bigint as total_bad,
    coalesce(sum(case when pr.condition = 'good' then 1 else 0 end), 0)::bigint as total_good,
    coalesce(sum(case when pr.has_photo then 1 else 0 end), 0)::bigint as with_photo,
    (
      coalesce(sum(case when pr.condition = 'blocked' then 1 else 0 end), 0)::numeric * 3.0 +
      coalesce(sum(case when pr.condition = 'bad' then 1 else 0 end), 0)::numeric * 2.0 +
      coalesce(sum(case when pr.verification_count >= 2 then 1 else 0 end), 0)::numeric * 1.5 +
      count(*)::numeric * 1.0
    )::numeric as priority_score
  from per_report pr
  group by pr.neighborhood
  order by priority_score desc, total_blocked desc, total_published desc
$$;

create or replace function public.get_neighborhood_recent_alerts(
  in_limit integer default 20
)
returns table (
  id uuid,
  created_at timestamptz,
  neighborhood text,
  condition text,
  verification_count bigint,
  is_verified boolean,
  has_photo boolean
)
language sql
stable
as $$
  with per_report as (
    select
      sr.id,
      sr.created_at,
      coalesce(nullif(trim(sr.neighborhood), ''), 'Sem informacao') as neighborhood,
      sr.condition,
      count(sv.user_id)::bigint as verification_count,
      (sr.photo_private_path is not null) as has_photo
    from public.sidewalk_reports sr
    left join public.sidewalk_verifications sv
      on sv.report_id = sr.id
    where sr.status = 'published'
    group by sr.id, sr.created_at, sr.neighborhood, sr.condition, sr.photo_private_path
  )
  select
    pr.id,
    pr.created_at,
    pr.neighborhood,
    pr.condition,
    pr.verification_count,
    (pr.verification_count >= 2) as is_verified,
    pr.has_photo
  from per_report pr
  order by
    case
      when pr.condition = 'blocked' then 0
      when pr.condition = 'bad' then 1
      else 2
    end,
    pr.created_at desc
  limit greatest(in_limit, 1)
$$;

create or replace function public.get_priority_map_points(
  in_days integer default 90,
  in_condition text default null
)
returns table (
  id uuid,
  lat double precision,
  lng double precision,
  neighborhood text,
  condition text,
  verification_count bigint,
  is_verified boolean
)
language sql
stable
as $$
  with per_report as (
    select
      sr.id,
      sr.created_at,
      sr.lat,
      sr.lng,
      coalesce(nullif(trim(sr.neighborhood), ''), 'Sem informacao') as neighborhood,
      sr.condition,
      count(sv.user_id)::bigint as verification_count
    from public.sidewalk_reports sr
    left join public.sidewalk_verifications sv
      on sv.report_id = sr.id
    where sr.status = 'published'
      and sr.created_at >= now() - (in_days || ' days')::interval
      and (in_condition is null or sr.condition = in_condition)
    group by sr.id, sr.created_at, sr.lat, sr.lng, sr.neighborhood, sr.condition
  )
  select
    pr.id,
    pr.lat,
    pr.lng,
    pr.neighborhood,
    pr.condition,
    pr.verification_count,
    (pr.verification_count >= 2) as is_verified
  from per_report pr
  order by pr.created_at desc nulls last
$$;

create index if not exists idx_sidewalk_reports_created_at_t09 on public.sidewalk_reports(created_at);
create index if not exists idx_sidewalk_reports_condition_t09 on public.sidewalk_reports(condition);
create index if not exists idx_sidewalk_reports_neighborhood_created_t09 on public.sidewalk_reports(neighborhood, created_at desc);

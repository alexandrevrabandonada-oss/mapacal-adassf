-- T12_timeline_hotspots.sql
-- Timeline visual e hotspots temporais (camada publica inicial)
-- Principio: leitura de ritmo e concentracao no tempo, sem inferencia causal.

create or replace function public.get_timeline_series(
  in_days integer default 90,
  in_bucket text default 'day',
  in_neighborhood text default null
)
returns table (
  bucket_start timestamptz,
  published_count bigint,
  verified_count bigint,
  blocked_count bigint,
  bad_count bigint,
  good_count bigint,
  with_photo_count bigint
)
language sql
stable
as $$
  with params as (
    select
      case when lower(coalesce(in_bucket, 'day')) = 'week' then 'week' else 'day' end as bucket,
      greatest(coalesce(in_days, 90), 1) as days
  ),
  verification_counts as (
    select sv.report_id, count(*)::bigint as verification_count
    from public.sidewalk_verifications sv
    group by sv.report_id
  ),
  base as (
    select
      date_trunc((select bucket from params), sr.created_at)::timestamptz as bucket_start,
      sr.condition,
      coalesce(vc.verification_count, 0) as verification_count,
      (sr.photo_private_path is not null or sr.photo_public_path is not null) as has_photo
    from public.sidewalk_reports sr
    left join verification_counts vc on vc.report_id = sr.id
    where sr.status = 'published'
      and sr.created_at >= now() - ((select days from params)::text || ' days')::interval
      and (in_neighborhood is null or sr.neighborhood = in_neighborhood)
  )
  select
    b.bucket_start,
    count(*)::bigint as published_count,
    sum(case when b.verification_count > 0 then 1 else 0 end)::bigint as verified_count,
    sum(case when b.condition = 'blocked' then 1 else 0 end)::bigint as blocked_count,
    sum(case when b.condition = 'bad' then 1 else 0 end)::bigint as bad_count,
    sum(case when b.condition = 'good' then 1 else 0 end)::bigint as good_count,
    sum(case when b.has_photo then 1 else 0 end)::bigint as with_photo_count
  from base b
  group by b.bucket_start
  order by b.bucket_start asc;
$$;

create or replace function public.get_timeline_condition_series(
  in_days integer default 90,
  in_bucket text default 'week',
  in_neighborhood text default null
)
returns table (
  bucket_start timestamptz,
  condition text,
  count bigint,
  verified_count bigint
)
language sql
stable
as $$
  with params as (
    select
      case when lower(coalesce(in_bucket, 'week')) = 'day' then 'day' else 'week' end as bucket,
      greatest(coalesce(in_days, 90), 1) as days
  ),
  verification_counts as (
    select sv.report_id, count(*)::bigint as verification_count
    from public.sidewalk_verifications sv
    group by sv.report_id
  )
  select
    date_trunc((select bucket from params), sr.created_at)::timestamptz as bucket_start,
    sr.condition,
    count(*)::bigint as count,
    sum(case when coalesce(vc.verification_count, 0) > 0 then 1 else 0 end)::bigint as verified_count
  from public.sidewalk_reports sr
  left join verification_counts vc on vc.report_id = sr.id
  where sr.status = 'published'
    and sr.created_at >= now() - ((select days from params)::text || ' days')::interval
    and (in_neighborhood is null or sr.neighborhood = in_neighborhood)
  group by bucket_start, sr.condition
  order by bucket_start asc, sr.condition asc;
$$;

create or replace function public.get_temporal_hotspots(
  in_days integer default 90,
  in_limit integer default 20
)
returns table (
  neighborhood text,
  condition text,
  count bigint,
  verified_count bigint,
  blocked_count bigint,
  latest_bucket timestamptz,
  hotspot_score numeric
)
language sql
stable
as $$
  with params as (
    select greatest(coalesce(in_days, 90), 1) as days
  ),
  verification_counts as (
    select sv.report_id, count(*)::bigint as verification_count
    from public.sidewalk_verifications sv
    group by sv.report_id
  ),
  bucketed as (
    select
      coalesce(sr.neighborhood, 'Sem bairro') as neighborhood,
      sr.condition,
      date_trunc('week', sr.created_at)::timestamptz as bucket_start,
      coalesce(vc.verification_count, 0) as verification_count
    from public.sidewalk_reports sr
    left join verification_counts vc on vc.report_id = sr.id
    where sr.status = 'published'
      and sr.created_at >= now() - ((select days from params)::text || ' days')::interval
  ),
  grouped as (
    select
      b.neighborhood,
      b.condition,
      count(*)::bigint as count,
      sum(case when b.verification_count > 0 then 1 else 0 end)::bigint as verified_count,
      sum(case when b.condition = 'blocked' then 1 else 0 end)::bigint as blocked_count,
      max(b.bucket_start)::timestamptz as latest_bucket
    from bucketed b
    group by b.neighborhood, b.condition
  )
  select
    g.neighborhood,
    g.condition,
    g.count,
    g.verified_count,
    g.blocked_count,
    g.latest_bucket,
    (
      g.count * 1.0
      + g.verified_count * 1.5
      + g.blocked_count * 2.0
      + case
          when g.latest_bucket >= now() - interval '14 days' then 3.0
          when g.latest_bucket >= now() - interval '30 days' then 1.0
          else 0.0
        end
    )::numeric as hotspot_score
  from grouped g
  order by hotspot_score desc, g.latest_bucket desc
  limit greatest(coalesce(in_limit, 20), 1);
$$;

create or replace function public.get_map_hotspots(
  in_days integer default 30,
  in_condition text default null,
  in_verified_only boolean default false
)
returns table (
  id uuid,
  lat double precision,
  lng double precision,
  neighborhood text,
  condition text,
  created_at timestamptz,
  verification_count bigint,
  is_verified boolean,
  hotspot_rank integer
)
language sql
stable
as $$
  with params as (
    select greatest(coalesce(in_days, 30), 1) as days
  ),
  verification_counts as (
    select sv.report_id, count(*)::bigint as verification_count
    from public.sidewalk_verifications sv
    group by sv.report_id
  ),
  base as (
    select
      sr.id,
      sr.lat,
      sr.lng,
      sr.neighborhood,
      sr.condition,
      sr.created_at,
      coalesce(vc.verification_count, 0)::bigint as verification_count,
      (coalesce(vc.verification_count, 0) > 0) as is_verified,
      case
        when sr.condition = 'blocked' then 3
        when sr.condition = 'bad' then 2
        else 1
      end as severity_weight
    from public.sidewalk_reports sr
    left join verification_counts vc on vc.report_id = sr.id
    where sr.status = 'published'
      and sr.created_at >= now() - ((select days from params)::text || ' days')::interval
      and (in_condition is null or sr.condition = in_condition)
      and (not in_verified_only or coalesce(vc.verification_count, 0) > 0)
  )
  select
    b.id,
    b.lat,
    b.lng,
    b.neighborhood,
    b.condition,
    b.created_at,
    b.verification_count,
    b.is_verified,
    row_number() over (
      order by b.severity_weight desc, b.verification_count desc, b.created_at desc
    )::integer as hotspot_rank
  from base b
  order by hotspot_rank asc;
$$;

create index if not exists idx_sidewalk_reports_created_at_desc
  on public.sidewalk_reports(created_at desc);

create index if not exists idx_sidewalk_reports_neighborhood_created_at
  on public.sidewalk_reports(neighborhood, created_at desc);

create index if not exists idx_sidewalk_reports_condition_created_at
  on public.sidewalk_reports(condition, created_at desc);
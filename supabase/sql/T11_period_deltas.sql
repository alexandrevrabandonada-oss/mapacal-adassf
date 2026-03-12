/**
 * T11_period_deltas.sql
 * Deltas honestos entre períodos, comparando por taxa diária
 * 
 * Princípio: (count_atual / dias_atual) vs (count_base / dias_base)
 * Nunca % ilusória quando baseline = 0
 */

-- ====================================================
-- RPC 1: get_period_delta_summary
-- Comparação geral: published, verified, blocked
-- ====================================================

create or replace function public.get_period_delta_summary(
  in_current_days integer default 7,
  in_baseline_days integer default 30,
  in_neighborhood text default null
)
returns table (
  current_days integer,
  baseline_days integer,
  current_published bigint,
  baseline_published bigint,
  current_per_day numeric,
  baseline_per_day numeric,
  published_delta_per_day numeric,
  published_delta_pct numeric,
  current_verified bigint,
  baseline_verified bigint,
  verified_delta_per_day numeric,
  verified_delta_pct numeric,
  current_blocked bigint,
  baseline_blocked bigint,
  blocked_delta_per_day numeric,
  blocked_delta_pct numeric
) as $$
declare
  v_cutoff_current timestamp;
  v_cutoff_baseline timestamp;
begin
  v_cutoff_current := now() - (in_current_days::text || ' days')::interval;
  v_cutoff_baseline := now() - (in_baseline_days::text || ' days')::interval;

  return query
  with current_window as (
    select
      count(*)::bigint as published,
      count(*) filter (where "status" = 'verified')::bigint as verified,
      count(*) filter (where "status" = 'blocked')::bigint as blocked
    from public.sidewalk_reports
    where created_at >= v_cutoff_current
      and status = 'published'
      and (in_neighborhood is null or neighborhood = in_neighborhood)
  ),
  baseline_window as (
    select
      count(*)::bigint as published,
      count(*) filter (where "status" = 'verified')::bigint as verified,
      count(*) filter (where "status" = 'blocked')::bigint as blocked
    from public.sidewalk_reports
    where created_at >= v_cutoff_baseline
      and created_at < v_cutoff_current
      and status = 'published'
      and (in_neighborhood is null or neighborhood = in_neighborhood)
  )
  select
    in_current_days,
    in_baseline_days,
    c.published,
    b.published,
    (c.published::numeric / in_current_days)::numeric as current_per_day,
    (b.published::numeric / in_baseline_days)::numeric as baseline_per_day,
    (c.published::numeric / in_current_days) - (b.published::numeric / in_baseline_days),
    case
      when (b.published::numeric / in_baseline_days) > 0
      then (((c.published::numeric / in_current_days) - (b.published::numeric / in_baseline_days)) / (b.published::numeric / in_baseline_days)) * 100
      else null
    end as published_delta_pct,
    c.verified,
    b.verified,
    (c.verified::numeric / in_current_days)::numeric as verified_delta_per_day,
    case
      when (b.verified::numeric / in_baseline_days) > 0
      then (((c.verified::numeric / in_current_days) - (b.verified::numeric / in_baseline_days)) / (b.verified::numeric / in_baseline_days)) * 100
      else null
    end as verified_delta_pct,
    c.blocked,
    b.blocked,
    (c.blocked::numeric / in_current_days)::numeric as blocked_delta_per_day,
    case
      when (b.blocked::numeric / in_baseline_days) > 0
      then (((c.blocked::numeric / in_current_days) - (b.blocked::numeric / in_baseline_days)) / (b.blocked::numeric / in_baseline_days)) * 100
      else null
    end as blocked_delta_pct
  from current_window c, baseline_window b;
end;
$$ language plpgsql;

-- ====================================================
-- RPC 2: get_condition_period_deltas
-- Deltas por condição: poor/fair/good/unknown
-- ====================================================

create or replace function public.get_condition_period_deltas(
  in_current_days integer default 7,
  in_baseline_days integer default 30,
  in_neighborhood text default null
)
returns table (
  condition text,
  current_count bigint,
  baseline_count bigint,
  current_per_day numeric,
  baseline_per_day numeric,
  delta_per_day numeric,
  delta_pct numeric,
  current_verified bigint,
  baseline_verified bigint
) as $$
declare
  v_cutoff_current timestamp;
  v_cutoff_baseline timestamp;
begin
  v_cutoff_current := now() - (in_current_days::text || ' days')::interval;
  v_cutoff_baseline := now() - (in_baseline_days::text || ' days')::interval;

  return query
  with current_window as (
    select
      condition,
      count(*)::bigint as cnt,
      count(*) filter (where status = 'verified')::bigint as verified
    from public.sidewalk_reports
    where created_at >= v_cutoff_current
      and status = 'published'
      and (in_neighborhood is null or neighborhood = in_neighborhood)
    group by condition
  ),
  baseline_window as (
    select
      condition,
      count(*)::bigint as cnt,
      count(*) filter (where status = 'verified')::bigint as verified
    from public.sidewalk_reports
    where created_at >= v_cutoff_baseline
      and created_at < v_cutoff_current
      and status = 'published'
      and (in_neighborhood is null or neighborhood = in_neighborhood)
    group by condition
  )
  select
    coalesce(c.condition, b.condition),
    coalesce(c.cnt, 0)::bigint,
    coalesce(b.cnt, 0)::bigint,
    coalesce(c.cnt, 0)::numeric / in_current_days,
    coalesce(b.cnt, 0)::numeric / in_baseline_days,
    (coalesce(c.cnt, 0)::numeric / in_current_days) - (coalesce(b.cnt, 0)::numeric / in_baseline_days),
    case
      when (coalesce(b.cnt, 0)::numeric / in_baseline_days) > 0
      then (((coalesce(c.cnt, 0)::numeric / in_current_days) - (coalesce(b.cnt, 0)::numeric / in_baseline_days)) / (coalesce(b.cnt, 0)::numeric / in_baseline_days)) * 100
      else null
    end,
    coalesce(c.verified, 0)::bigint,
    coalesce(b.verified, 0)::bigint
  from current_window c
  full outer join baseline_window b on c.condition = b.condition
  order by delta_per_day desc nulls last;
end;
$$ language plpgsql;

-- ====================================================
-- RPC 3: get_neighborhood_period_deltas
-- Deltas por bairro
-- ====================================================

create or replace function public.get_neighborhood_period_deltas(
  in_current_days integer default 7,
  in_baseline_days integer default 30
)
returns table (
  neighborhood text,
  current_count bigint,
  baseline_count bigint,
  current_per_day numeric,
  baseline_per_day numeric,
  delta_per_day numeric,
  delta_pct numeric,
  current_blocked bigint,
  baseline_blocked bigint,
  current_verified bigint,
  baseline_verified bigint,
  current_with_photo bigint,
  baseline_with_photo bigint
) as $$
declare
  v_cutoff_current timestamp;
  v_cutoff_baseline timestamp;
begin
  v_cutoff_current := now() - (in_current_days::text || ' days')::interval;
  v_cutoff_baseline := now() - (in_baseline_days::text || ' days')::interval;

  return query
  with current_window as (
    select
      coalesce(neighborhood, 'Sem bairro') as neighborhood,
      count(*)::bigint as cnt,
      count(*) filter (where status = 'blocked')::bigint as blocked,
      count(*) filter (where status = 'verified')::bigint as verified,
      count(*) filter (where photo_public_path is not null)::bigint as with_photo
    from public.sidewalk_reports
    where created_at >= v_cutoff_current
      and status = 'published'
    group by neighborhood
  ),
  baseline_window as (
    select
      coalesce(neighborhood, 'Sem bairro') as neighborhood,
      count(*)::bigint as cnt,
      count(*) filter (where status = 'blocked')::bigint as blocked,
      count(*) filter (where status = 'verified')::bigint as verified,
      count(*) filter (where photo_public_path is not null)::bigint as with_photo
    from public.sidewalk_reports
    where created_at >= v_cutoff_baseline
      and created_at < v_cutoff_current
      and status = 'published'
    group by neighborhood
  )
  select
    coalesce(c.neighborhood, b.neighborhood),
    coalesce(c.cnt, 0)::bigint,
    coalesce(b.cnt, 0)::bigint,
    coalesce(c.cnt, 0)::numeric / in_current_days,
    coalesce(b.cnt, 0)::numeric / in_baseline_days,
    (coalesce(c.cnt, 0)::numeric / in_current_days) - (coalesce(b.cnt, 0)::numeric / in_baseline_days),
    case
      when (coalesce(b.cnt, 0)::numeric / in_baseline_days) > 0
      then (((coalesce(c.cnt, 0)::numeric / in_current_days) - (coalesce(b.cnt, 0)::numeric / in_baseline_days)) / (coalesce(b.cnt, 0)::numeric / in_baseline_days)) * 100
      else null
    end,
    coalesce(c.blocked, 0)::bigint,
    coalesce(b.blocked, 0)::bigint,
    coalesce(c.verified, 0)::bigint,
    coalesce(b.verified, 0)::bigint,
    coalesce(c.with_photo, 0)::bigint,
    coalesce(b.with_photo, 0)::bigint
  from current_window c
  full outer join baseline_window b on c.neighborhood = b.neighborhood
  order by delta_per_day desc nulls last;
end;
$$ language plpgsql;

-- ====================================================
-- RPC 4: get_acceleration_alerts
-- Top N pares (bairro, condição) com maior agravamento
-- ====================================================

create or replace function public.get_acceleration_alerts(
  in_current_days integer default 7,
  in_baseline_days integer default 30,
  in_limit integer default 12
)
returns table (
  neighborhood text,
  condition text,
  current_per_day numeric,
  baseline_per_day numeric,
  delta_per_day numeric,
  delta_pct numeric,
  severity_rank integer
) as $$
declare
  v_cutoff_current timestamp;
  v_cutoff_baseline timestamp;
begin
  v_cutoff_current := now() - (in_current_days::text || ' days')::interval;
  v_cutoff_baseline := now() - (in_baseline_days::text || ' days')::interval;

  return query
  with current_window as (
    select
      coalesce(neighborhood, 'Sem bairro') as neighborhood,
      condition,
      count(*)::bigint as cnt
    from public.sidewalk_reports
    where created_at >= v_cutoff_current
      and status = 'published'
    group by neighborhood, condition
  ),
  baseline_window as (
    select
      coalesce(neighborhood, 'Sem bairro') as neighborhood,
      condition,
      count(*)::bigint as cnt
    from public.sidewalk_reports
    where created_at >= v_cutoff_baseline
      and created_at < v_cutoff_current
      and status = 'published'
    group by neighborhood, condition
  ),
  deltas as (
    select
      coalesce(c.neighborhood, b.neighborhood) as neighborhood,
      coalesce(c.condition, b.condition) as condition,
      coalesce(c.cnt, 0)::numeric / in_current_days as current_per_day,
      coalesce(b.cnt, 0)::numeric / in_baseline_days as baseline_per_day,
      (coalesce(c.cnt, 0)::numeric / in_current_days) - (coalesce(b.cnt, 0)::numeric / in_baseline_days) as delta_per_day,
      case
        when (coalesce(b.cnt, 0)::numeric / in_baseline_days) > 0
        then (((coalesce(c.cnt, 0)::numeric / in_current_days) - (coalesce(b.cnt, 0)::numeric / in_baseline_days)) / (coalesce(b.cnt, 0)::numeric / in_baseline_days)) * 100
        else null
      end as delta_pct
    from current_window c
    full outer join baseline_window b 
      on c.neighborhood = b.neighborhood 
      and c.condition = b.condition
    where (coalesce(c.cnt, 0) > 0 or coalesce(b.cnt, 0) > 0)
      and ((coalesce(c.cnt, 0)::numeric / in_current_days) - (coalesce(b.cnt, 0)::numeric / in_baseline_days)) > 0
  )
  select
    neighborhood,
    condition,
    current_per_day,
    baseline_per_day,
    delta_per_day,
    delta_pct,
    row_number() over (order by delta_per_day desc) as severity_rank
  from deltas
  order by severity_rank
  limit in_limit;
end;
$$ language plpgsql;

-- ====================================================
-- Índices auxiliares para performance (idempotentes)
-- ====================================================

create index if not exists idx_reports_created_at 
  on public.sidewalk_reports(created_at desc);

create index if not exists idx_reports_neighborhood_created_at 
  on public.sidewalk_reports(neighborhood, created_at desc);

create index if not exists idx_reports_condition_created_at 
  on public.sidewalk_reports(condition, created_at desc);

create index if not exists idx_reports_status_created_at
  on public.sidewalk_reports(status, created_at desc);

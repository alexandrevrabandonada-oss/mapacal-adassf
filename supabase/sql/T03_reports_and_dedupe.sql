-- T03 complemento: criacao de reports + dedupe inicial por raio
-- Aplicar via Supabase SQL Editor apos T02_base_schema.sql

create extension if not exists postgis;

-- Garantias de indices principais para busca e filtros
create index if not exists idx_sidewalk_reports_geom on public.sidewalk_reports using gist(geom);
create index if not exists idx_sidewalk_reports_status on public.sidewalk_reports(status);
create index if not exists idx_sidewalk_reports_neighborhood on public.sidewalk_reports(neighborhood);

-- Trigger de updated_at (idempotente com drop/create)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sidewalk_reports_updated_at on public.sidewalk_reports;
create trigger sidewalk_reports_updated_at
  before update on public.sidewalk_reports
  for each row
  execute function public.handle_updated_at();

-- RPC de dedupe inicial para listar pontos publicados proximos
create or replace function public.nearby_sidewalk_reports(
  in_lat double precision,
  in_lng double precision,
  in_meters integer default 25
)
returns table (
  id uuid,
  condition text,
  neighborhood text,
  created_at timestamptz,
  distance_m double precision
)
language sql
stable
as $$
  select
    sr.id,
    sr.condition,
    sr.neighborhood,
    sr.created_at,
    st_distance(
      sr.geom,
      st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography
    ) as distance_m
  from public.sidewalk_reports sr
  where sr.status = 'published'
    and st_dwithin(
      sr.geom,
      st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography,
      greatest(in_meters, 1)
    )
  order by distance_m asc
  limit 20;
$$;

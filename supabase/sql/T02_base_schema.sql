-- T02 Base schema para Mapa de Calcadas do Sul Fluminense
-- Este script cria a estrutura inicial sem dados sensíveis ou relacionados a upload.
-- Aplicar tudo de uma vez via SQL Editor do Supabase para garantir idempotência.

-- ============================================================
-- Extensões
-- ============================================================
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- ============================================================
-- Tabelas
-- ============================================================

-- Profiles: metadados de usuários autenticados
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sidewalk Reports: registros principais de problema em calçadas
create table if not exists public.sidewalk_reports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending',
  condition text not null,
  lat double precision not null,
  lng double precision not null,
  geom geography(Point, 4326) generated always as (
    st_point(lng, lat)::geography
  ) stored,
  neighborhood text,
  note text,
  photo_public_path text,
  photo_private_path text,
  needs_review boolean not null default false,
  accuracy_m double precision
);

-- Sidewalk Tags: categorias de problemas
create table if not exists public.sidewalk_tags (
  slug text primary key,
  label text not null
);

-- Sidewalk Report Tags: relacionamento many-to-many
create table if not exists public.sidewalk_report_tags (
  report_id uuid not null references public.sidewalk_reports(id) on delete cascade,
  tag_slug text not null references public.sidewalk_tags(slug) on delete restrict,
  primary key (report_id, tag_slug)
);

-- Sidewalk Verifications: confirmações de relatos por outros usuários
create table if not exists public.sidewalk_verifications (
  report_id uuid not null references public.sidewalk_reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

-- Moderation Events: histórico de ações de moderação
create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.sidewalk_reports(id) on delete cascade,
  moderator_id uuid references public.profiles(id) on delete set null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Índices
-- ============================================================
create index if not exists idx_sidewalk_reports_status on public.sidewalk_reports(status);
create index if not exists idx_sidewalk_reports_neighborhood on public.sidewalk_reports(neighborhood);
create index if not exists idx_sidewalk_reports_created_by on public.sidewalk_reports(created_by);
create index if not exists idx_sidewalk_reports_created_at on public.sidewalk_reports(created_at);
create index if not exists idx_sidewalk_reports_geom on public.sidewalk_reports using gist(geom);
create index if not exists idx_sidewalk_report_tags_slug on public.sidewalk_report_tags(tag_slug);
create index if not exists idx_sidewalk_verifications_user_id on public.sidewalk_verifications(user_id);
create index if not exists idx_moderation_events_report_id on public.moderation_events(report_id);
create index if not exists idx_moderation_events_moderator_id on public.moderation_events(moderator_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.sidewalk_reports enable row level security;
alter table public.sidewalk_tags enable row level security;
alter table public.sidewalk_report_tags enable row level security;
alter table public.sidewalk_verifications enable row level security;
alter table public.moderation_events enable row level security;

-- Profiles: apenas autenticados podem ler seu próprio perfil; público lê minimalista
create policy "Public profiles readable by authenticated"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Sidewalk Reports: público lê status='published'; auth pode criar seus próprios; moderadores atualizam
create policy "Public can read published reports"
  on public.sidewalk_reports for select
  using (status = 'published' or (auth.role() = 'authenticated' and created_by = auth.uid()));

create policy "Authenticated can create reports"
  on public.sidewalk_reports for insert
  with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy "Users can update their own pending reports"
  on public.sidewalk_reports for update
  using (
    auth.role() = 'authenticated' and (
      created_by = auth.uid() and status = 'pending'
    )
  );

create policy "Moderators can update any report"
  on public.sidewalk_reports for update
  using (
    auth.role() = 'authenticated' and (
      exists(
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'moderator'
      )
    )
  );

-- Sidewalk Tags: público lê
create policy "Public can read tags"
  on public.sidewalk_tags for select
  using (true);

-- Sidewalk Report Tags: lê conforme report publication
create policy "Public can read tags of published reports"
  on public.sidewalk_report_tags for select
  using (
    exists(
      select 1 from public.sidewalk_reports
      where sidewalk_reports.id = report_id and sidewalk_reports.status = 'published'
    )
  );

-- Sidewalk Verifications: lê conforme report publication; auth insere suas próprias
create policy "Public can read verifications of published reports"
  on public.sidewalk_verifications for select
  using (
    exists(
      select 1 from public.sidewalk_reports
      where sidewalk_reports.id = report_id and sidewalk_reports.status = 'published'
    )
  );

create policy "Authenticated can insert their own verification"
  on public.sidewalk_verifications for insert
  with check (auth.uid() = user_id);

-- Moderation Events: lê conforme report publication; moderadores criam
create policy "Public can read moderation events of published reports"
  on public.moderation_events for select
  using (
    exists(
      select 1 from public.sidewalk_reports
      where sidewalk_reports.id = report_id and sidewalk_reports.status = 'published'
    )
  );

create policy "Moderators can create events"
  on public.moderation_events for insert
  with check (
    auth.role() = 'authenticated' and exists(
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'moderator'
    )
  );

-- ============================================================
-- Seed Data
-- ============================================================

-- Tags iniciais
insert into public.sidewalk_tags (slug, label) values
  ('buraco', 'Buraco'),
  ('piso_quebrado', 'Piso quebrado'),
  ('irregular', 'Superfície irregular'),
  ('sem_rampa', 'Sem rampa'),
  ('rampa_ruim', 'Rampa inadequada'),
  ('poste_no_meio', 'Poste no meio'),
  ('entulho', 'Entulho'),
  ('raiz', 'Raiz ou arvore'),
  ('alagamento', 'Alagamento'),
  ('obra', 'Obra em aberto')
on conflict (slug) do nothing;

-- ============================================================
-- Triggers
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sidewalk_reports_updated_at
  before update on public.sidewalk_reports
  for each row
  execute function public.handle_updated_at();

-- T06: Moderação operacional (painel admin funcional)
-- Aplicar via Supabase SQL Editor após T02, T03, T04, T05

-- ============================================================
-- Helper: verificar se usuário é moderador/admin
-- ============================================================
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('moderator', 'admin')
  );
$$;

-- ============================================================
-- RPC: listar reports para moderação
-- ============================================================
create or replace function public.list_reports_for_moderation(
  in_status text default null,
  in_limit integer default 100
)
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid,
  status text,
  condition text,
  neighborhood text,
  note text,
  lat double precision,
  lng double precision,
  needs_review boolean,
  accuracy_m double precision,
  verification_count bigint,
  is_verified boolean
)
language plpgsql
stable
security definer
as $$
begin
  -- exigir autenticação
  if auth.uid() is null then
    raise exception 'Autenticacao necessaria';
  end if;

  -- exigir role moderator/admin
  if not public.is_moderator() then
    raise exception 'Permissao insuficiente: somente moderadores';
  end if;

  return query
  select
    sr.id,
    sr.created_at,
    sr.updated_at,
    sr.created_by,
    sr.status,
    sr.condition,
    sr.neighborhood,
    sr.note,
    sr.lat,
    sr.lng,
    sr.needs_review,
    sr.accuracy_m,
    count(sv.user_id)::bigint as verification_count,
    (count(sv.user_id) >= 2) as is_verified
  from public.sidewalk_reports sr
  left join public.sidewalk_verifications sv
    on sv.report_id = sr.id
  where (in_status is null or sr.status = in_status)
  group by sr.id, sr.created_at, sr.updated_at, sr.created_by,
           sr.status, sr.condition, sr.neighborhood, sr.note,
           sr.lat, sr.lng, sr.needs_review, sr.accuracy_m
  order by
    case when sr.status = 'pending' then 0
         when sr.needs_review then 1
         else 2
    end,
    sr.created_at desc
  limit in_limit;
end;
$$;

-- ============================================================
-- RPC: moderar report (publicar, ocultar, pedir revisão)
-- ============================================================
create or replace function public.moderate_sidewalk_report(
  in_report_id uuid,
  in_action text,
  in_reason text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_moderator_id uuid;
  v_current_status text;
  v_new_status text;
  v_needs_review boolean;
begin
  -- exigir autenticação
  v_moderator_id := auth.uid();
  if v_moderator_id is null then
    return json_build_object(
      'ok', false,
      'message', 'Autenticacao necessaria'
    );
  end if;

  -- exigir role moderator/admin
  if not public.is_moderator() then
    return json_build_object(
      'ok', false,
      'message', 'Permissao insuficiente: somente moderadores'
    );
  end if;

  -- verificar se report existe
  select status into v_current_status
  from public.sidewalk_reports
  where id = in_report_id;

  if v_current_status is null then
    return json_build_object(
      'ok', false,
      'message', 'Report nao encontrado'
    );
  end if;

  -- aplicar ação
  case in_action
    when 'publish' then
      v_new_status := 'published';
      v_needs_review := false;
    when 'hide' then
      v_new_status := 'hidden';
      v_needs_review := false;
    when 'request_review' then
      v_new_status := v_current_status;
      v_needs_review := true;
    else
      return json_build_object(
        'ok', false,
        'message', 'Acao invalida: use publish, hide ou request_review'
      );
  end case;

  -- atualizar report
  update public.sidewalk_reports
  set
    status = v_new_status,
    needs_review = v_needs_review,
    updated_at = now()
  where id = in_report_id;

  -- registrar evento de moderação
  insert into public.moderation_events (report_id, moderator_id, action, reason)
  values (in_report_id, v_moderator_id, in_action, in_reason);

  return json_build_object(
    'ok', true,
    'message', case in_action
      when 'publish' then 'Report publicado com sucesso'
      when 'hide' then 'Report ocultado com sucesso'
      when 'request_review' then 'Revisao solicitada com sucesso'
    end,
    'new_status', v_new_status
  );
end;
$$;

-- ============================================================
-- Índices adicionais para performance de moderação
-- ============================================================
create index if not exists idx_sidewalk_reports_needs_review
  on public.sidewalk_reports(needs_review)
  where needs_review = true;

create index if not exists idx_profiles_role
  on public.profiles(role)
  where role in ('moderator', 'admin');

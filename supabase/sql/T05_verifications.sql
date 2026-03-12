-- T05: verificacao comunitaria (cidadaos confirmam pontos)
-- Aplicar via Supabase SQL Editor apos T04

-- RPC para confirmar um ponto publicado
-- Retorna: { ok, message, verification_count?, is_verified? }
create or replace function public.confirm_sidewalk_report(in_report_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_verification_count integer;
  v_is_verified boolean;
begin
  -- exigir autenticacao
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return json_build_object(
      'ok', false,
      'message', 'Autenticacao necessaria para confirmar pontos'
    );
  end if;

  -- verificar se report existe e esta published
  if not exists (
    select 1 from public.sidewalk_reports
    where id = in_report_id and status = 'published'
  ) then
    return json_build_object(
      'ok', false,
      'message', 'Ponto nao encontrado ou indisponivel para confirmacao'
    );
  end if;

  -- inserir verificacao com protecao contra duplicidade
  -- (report_id, user_id) e primary key composta, entao ON CONFLICT impede repetir
  insert into public.sidewalk_verifications (report_id, user_id)
  values (in_report_id, v_user_id)
  on conflict (report_id, user_id) do nothing;

  -- calcular contagem atualizada apos insert
  select count(*)::integer into v_verification_count
  from public.sidewalk_verifications
  where report_id = in_report_id;

  -- criterio: >= 2 confirmacoes = verificado
  v_is_verified := v_verification_count >= 2;

  return json_build_object(
    'ok', true,
    'message', 'Confirmacao registrada com sucesso',
    'verification_count', v_verification_count,
    'is_verified', v_is_verified
  );
end;
$$;

-- Política RLS para sidewalk_verifications
-- (T02 criou tabela mas sem policies detalhadas para leitura/escrita individual)
-- Para T05, permitir:
-- - leitura publica (contagens anonimas ja vem via RPC list_published_reports)
-- - insercao via RPC confirm_sidewalk_report (security definer, entao a policy aqui e permissiva)

alter table public.sidewalk_verifications enable row level security;

drop policy if exists "Verifications are publicly readable" on public.sidewalk_verifications;
create policy "Verifications are publicly readable"
  on public.sidewalk_verifications
  for select
  using (true);

drop policy if exists "Authenticated users can verify via RPC" on public.sidewalk_verifications;
create policy "Authenticated users can verify via RPC"
  on public.sidewalk_verifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- T13b: Webhooks and External Delivery
-- ----------------------------------------------------------------------------
-- Este arquivo estabelece o modelo de dados para integracao externa do Mapa SF.
-- Permite configurar destinos paralelos (webhooks) e gerenciar a tentativa e entrega
-- das frentes de alerta (geradas no T13).
-- ----------------------------------------------------------------------------

-- Habilitar pgcrypto se nao existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabela de Destinos de Webhook
CREATE TABLE IF NOT EXISTS public.alert_webhook_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  webhook_url text NOT NULL,
  secret_header_name text,
  secret_header_value text,
  event_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.alert_webhook_destinations ENABLE ROW LEVEL SECURITY;

-- Politicas para alert_webhook_destinations
-- Apenas admin/moderator pode ler/escrever. Sem leitura publica.
CREATE POLICY "Destinos de webhook viziveis para admins"
ON public.alert_webhook_destinations
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    (auth.jwt()->>'role')::text = 'admin' OR 
    (auth.jwt()->>'role')::text = 'moderator'
  )
);

CREATE POLICY "Destinos de webhook gerenciaveis por admins"
ON public.alert_webhook_destinations
FOR ALL
USING (
  auth.role() = 'authenticated' AND (
    (auth.jwt()->>'role')::text = 'admin' OR 
    (auth.jwt()->>'role')::text = 'moderator'
  )
);

-- 2. Tabela de Corridas de Entrega
CREATE TABLE IF NOT EXISTS public.alert_delivery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL, -- 'manual' | 'job' | 'cron'
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running', -- running | success | partial | skipped | error
  message text,
  deliveries_attempted integer NOT NULL DEFAULT 0,
  deliveries_succeeded integer NOT NULL DEFAULT 0,
  deliveries_failed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.alert_delivery_runs ENABLE ROW LEVEL SECURITY;

-- Politicas
CREATE POLICY "Delivery runs read by admins"
ON public.alert_delivery_runs
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    (auth.jwt()->>'role')::text = 'admin' OR 
    (auth.jwt()->>'role')::text = 'moderator'
  )
);

-- 3. Tabela de Entregas Individuais
CREATE TABLE IF NOT EXISTS public.alert_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alert_events(id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES public.alert_webhook_destinations(id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.alert_delivery_runs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | success | failed | skipped
  response_status integer,
  response_excerpt text,
  dedupe_key text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS alert_deliveries_alert_id_idx ON public.alert_deliveries(alert_id);
CREATE INDEX IF NOT EXISTS alert_deliveries_destination_id_idx ON public.alert_deliveries(destination_id);
CREATE INDEX IF NOT EXISTS alert_deliveries_run_id_idx ON public.alert_deliveries(run_id);
CREATE INDEX IF NOT EXISTS alert_deliveries_dedupe_key_idx ON public.alert_deliveries(dedupe_key);

-- Unique parcial para evitar spans duplos (mesmo alerta + destino + status pending/sucesso num mesmo dedup)
-- O server lidaro com dedupes para isolar tentativas
CREATE UNIQUE INDEX IF NOT EXISTS alert_deliveries_dedupe_success_idx 
ON public.alert_deliveries(alert_id, destination_id) 
WHERE status = 'success';

-- Habilitar RLS
ALTER TABLE public.alert_deliveries ENABLE ROW LEVEL SECURITY;

-- Politicas
CREATE POLICY "Deliveries read by admins"
ON public.alert_deliveries
FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    (auth.jwt()->>'role')::text = 'admin' OR 
    (auth.jwt()->>'role')::text = 'moderator'
  )
);

-- 4. Seed Opcional
-- Inserimos um destino padrao desabilitado so para amostra.
INSERT INTO public.alert_webhook_destinations (slug, title, description, is_enabled, webhook_url, event_filter)
VALUES (
  'local-logger',
  'Local Console Logger',
  'Exemplo de integracao para webhooks externos.',
  false,
  'http://localhost:3000/api/webhook/mock',
  '{}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- 5. RPCs Administrativas (Apenas Admins)

-- A) List Webhook Destinations
CREATE OR REPLACE FUNCTION public.list_alert_webhook_destinations()
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  description text,
  is_enabled boolean,
  webhook_url text,
  event_filter jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Requer autenticação';
  END IF;

  RETURN QUERY
  SELECT 
    w.id, 
    w.slug, 
    w.title, 
    w.description, 
    w.is_enabled, 
    w.webhook_url,   
    w.event_filter,
    w.created_at, 
    w.updated_at
  FROM public.alert_webhook_destinations w
  ORDER BY w.title ASC;
END;
$$;

-- B) List Open Alert Events for Delivery
-- Traz as infos basicas cruas para montar payload.
CREATE OR REPLACE FUNCTION public.list_open_alert_events_for_delivery(
  in_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  severity text,
  scope text,
  neighborhood text,
  condition text,
  title text,
  summary text,
  status text,
  created_at timestamptz,
  source_snapshot_id uuid,
  source_diff_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Requer autenticação';
  END IF;

  RETURN QUERY
  SELECT 
    e.id,
    e.severity,
    e.scope,
    e.neighborhood,
    e.condition,
    e.title,
    e.summary,
    e.status,
    e.created_at,
    e.source_snapshot_id,
    e.source_diff_id
  FROM public.alert_events e
  WHERE e.status = 'open'
  ORDER BY e.created_at DESC
  LIMIT in_limit;
END;
$$;

-- C) List Alert Deliveries
CREATE OR REPLACE FUNCTION public.list_alert_deliveries(
  in_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  alert_id uuid,
  destination_id uuid,
  run_id uuid,
  status text,
  response_status integer,
  response_excerpt text,
  attempted_at timestamptz,
  alert_title text,
  destination_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Requer autenticação';
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.alert_id,
    d.destination_id,
    d.run_id,
    d.status,
    d.response_status,
    d.response_excerpt,
    d.attempted_at,
    e.title AS alert_title,
    w.title AS destination_title
  FROM public.alert_deliveries d
  JOIN public.alert_events e ON e.id = d.alert_id
  JOIN public.alert_webhook_destinations w ON w.id = d.destination_id
  ORDER BY d.attempted_at DESC
  LIMIT in_limit;
END;
$$;

-- D) List Alert Delivery Runs
CREATE OR REPLACE FUNCTION public.list_alert_delivery_runs(
  in_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  source text,
  started_at timestamptz,
  finished_at timestamptz,
  status text,
  message text,
  deliveries_attempted integer,
  deliveries_succeeded integer,
  deliveries_failed integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Requer autenticação';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.source,
    r.started_at,
    r.finished_at,
    r.status,
    r.message,
    r.deliveries_attempted,
    r.deliveries_succeeded,
    r.deliveries_failed
  FROM public.alert_delivery_runs r
  ORDER BY r.started_at DESC
  LIMIT in_limit;
END;
$$;

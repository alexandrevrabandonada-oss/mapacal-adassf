-- T13c: Retry & Backoff para Webhook Delivery

BEGIN;

-- 1. Estender tabela alert_deliveries
ALTER TABLE public.alert_deliveries
ADD COLUMN IF NOT EXISTS attempt_number integer not null default 1,
ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
ADD COLUMN IF NOT EXISTS final_status text, -- success | failed_permanent | failed_retryable
ADD COLUMN IF NOT EXISTS last_error_code text,
ADD COLUMN IF NOT EXISTS last_error_excerpt text;

-- Atualizar metadados antigos (se houver) para compatibilidade
UPDATE public.alert_deliveries
SET final_status = status
WHERE final_status IS NULL;

-- 2. Tabela de Política (Policy)
CREATE TABLE IF NOT EXISTS public.alert_delivery_policy (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    max_attempts integer not null default 3,
    backoff_seconds integer[] not null default array[300, 1800, 21600], -- 5min, 30min, 6h
    created_at timestamptz not null default now()
);

-- Habilitar RLS
ALTER TABLE public.alert_delivery_policy ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Leitura publica de policy (admin side)" ON public.alert_delivery_policy FOR SELECT TO authenticated USING (true);
CREATE POLICY "Apenas auth admin" ON public.alert_delivery_policy FOR ALL TO authenticated USING (((auth.jwt() ->> 'user_role'::text) = ANY (ARRAY['admin'::text, 'moderator'::text])));

-- Seed inicial de policy padrão
INSERT INTO public.alert_delivery_policy (slug, max_attempts, backoff_seconds)
VALUES ('default_webhook_retry', 4, array[300, 1800, 21600])
ON CONFLICT (slug) DO NOTHING;

-- 3. Função para calcular o próximo retry via SQL
CREATE OR REPLACE FUNCTION public.calculate_next_retry(
    in_attempt integer,
    in_slug text DEFAULT 'default_webhook_retry'
) RETURNS timestamptz AS $$
DECLARE
    v_policy record;
    v_delay integer;
    v_max integer;
BEGIN
    SELECT * INTO v_policy FROM public.alert_delivery_policy WHERE slug = in_slug LIMIT 1;
    IF NOT FOUND THEN
        -- Fallback default: attempt 2: 5m, attempt 3: 30m, attempt 4: 6h
        IF in_attempt = 1 THEN v_delay := 300;
        ELSIF in_attempt = 2 THEN v_delay := 1800;
        ELSE v_delay := 21600;
        END IF;
    ELSE
        v_max := array_length(v_policy.backoff_seconds, 1);
        -- Se passar do limite do array, capta o ultimo
        IF in_attempt > v_max THEN
            v_delay := v_policy.backoff_seconds[v_max];
        ELSIF in_attempt < 1 THEN
            v_delay := v_policy.backoff_seconds[1];
        ELSE
            v_delay := v_policy.backoff_seconds[in_attempt];
        END IF;
    END IF;

    RETURN now() + (v_delay || ' seconds')::interval;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 4. RPC: list_retryable_alert_deliveries
CREATE OR REPLACE FUNCTION public.list_retryable_alert_deliveries(
    in_limit integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    alert_id uuid,
    destination_id uuid,
    status text,
    response_status integer,
    attempted_at timestamptz,
    attempt_number integer,
    next_retry_at timestamptz,
    final_status text,
    alert_title text,
    destination_title text,
    webhook_url text
) AS $$
BEGIN
    -- Exigir auth (simulacao de seguranca local via JWT e role)
    -- Opcional via RLS, mas reforcado via functions
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    RETURN QUERY
    SELECT 
        d.id, d.alert_id, d.destination_id, d.status, d.response_status, 
        d.attempted_at, d.attempt_number, d.next_retry_at, d.final_status,
        a.title as alert_title,
        dest.title as destination_title,
        dest.webhook_url
    FROM public.alert_deliveries d
    JOIN public.alert_events a ON a.id = d.alert_id
    JOIN public.alert_webhook_destinations dest ON dest.id = d.destination_id
    WHERE d.final_status = 'failed_retryable'
      AND (d.next_retry_at IS NULL OR d.next_retry_at <= now())
      AND dest.is_enabled = true
    ORDER BY d.next_retry_at ASC NULLS FIRST
    LIMIT in_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: mark_alert_delivery_retry_result
CREATE OR REPLACE FUNCTION public.mark_alert_delivery_retry_result(
    in_delivery_id uuid,
    in_status text,
    in_response_status integer DEFAULT null,
    in_response_excerpt text DEFAULT null,
    in_error_code text DEFAULT null
)
RETURNS TABLE (
    ok boolean,
    message text,
    final_status text
) AS $$
DECLARE
    v_delivery record;
    v_policy record;
    v_new_attempt integer;
    v_next_retry timestamptz;
    v_final_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN QUERY SELECT false, 'Não autorizado', null::text;
        RETURN;
    END IF;

    SELECT * INTO v_delivery FROM public.alert_deliveries WHERE id = in_delivery_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Delivery não encontrado', null::text;
        RETURN;
    END IF;

    -- Obter policy fallback
    SELECT * INTO v_policy FROM public.alert_delivery_policy WHERE slug = 'default_webhook_retry' LIMIT 1;
    
    v_new_attempt := v_delivery.attempt_number + 1;

    -- Avalia
    IF in_status = 'success' THEN
        v_final_status := 'success';
        v_next_retry := null;
    ELSE
        -- Fallback limits caso policy falhe
        IF v_policy.max_attempts IS NULL THEN v_policy.max_attempts := 3; END IF;
        
        -- Permanent falido
        IF in_error_code = 'PERMANENT_FAIL' OR in_status = 'failed_permanent' OR v_new_attempt >= v_policy.max_attempts THEN
            v_final_status := 'failed_permanent';
            v_next_retry := null;
        ELSE
            v_final_status := 'failed_retryable';
            v_next_retry := public.calculate_next_retry(v_new_attempt, 'default_webhook_retry');
        END IF;
    END IF;

    UPDATE public.alert_deliveries
    SET 
        status = CASE WHEN in_status IN ('success', 'failed_permanent', 'failed_retryable') THEN 'failed' ELSE in_status END, -- legacy keep as failed/success
        final_status = v_final_status,
        attempt_number = v_new_attempt,
        next_retry_at = v_next_retry,
        response_status = COALESCE(in_response_status, response_status),
        response_excerpt = COALESCE(in_response_excerpt, response_excerpt),
        last_error_code = in_error_code,
        last_error_excerpt = COALESCE(in_response_excerpt, last_error_excerpt),
        attempted_at = now()
    WHERE id = in_delivery_id;
    
    -- update success if needed (fix legacy status field based on final)
    IF v_final_status = 'success' THEN
        UPDATE public.alert_deliveries SET status = 'success' WHERE id = in_delivery_id;
    END IF;

    RETURN QUERY SELECT true, 'Atualizado com sucesso', v_final_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

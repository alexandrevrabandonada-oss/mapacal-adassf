/*
  T15 - Destinos Nativos para Alertas (Slack, Discord, Telegram)
  Extensão da tabela `alert_webhook_destinations` para suportar tipificação nativa.
*/

-- 1. Estender a tabela existente (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alert_webhook_destinations' AND column_name = 'destination_type') THEN
        ALTER TABLE public.alert_webhook_destinations ADD COLUMN destination_type text not null default 'generic_webhook';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alert_webhook_destinations' AND column_name = 'destination_config') THEN
        ALTER TABLE public.alert_webhook_destinations ADD COLUMN destination_config jsonb not null default '{}'::jsonb;
    END IF;
END $$;

-- 2. Constraints para garantir integridade do tipo de destino
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_destination_type') THEN
        ALTER TABLE public.alert_webhook_destinations
        ADD CONSTRAINT valid_destination_type 
        CHECK (destination_type IN ('generic_webhook', 'slack_webhook', 'discord_webhook', 'telegram_bot'));
    END IF;
END $$;

-- 3. RPC Administrativa para listagem de destinos sem expor secrets completos
-- O front não deve receber a URL inteira nem o token inteiro do Telegram
CREATE OR REPLACE FUNCTION public.list_alert_destinations()
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  description text,
  is_enabled boolean,
  destination_type text,
  destination_config jsonb,
  signing_mode text,
  url_masked text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Permitir apenas moderators ou admins ler a listagem
    IF auth.uid() IS NULL OR (
        NOT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('moderator', 'admin')
        )
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Requer permissão de moderador ou administrador.';
    END IF;

    RETURN QUERY
    SELECT 
        d.id,
        d.slug,
        d.title,
        d.description,
        d.is_enabled,
        d.destination_type,
        d.destination_config,
        d.signing_mode,
        -- Mask URL securely
        CASE 
            WHEN d.url IS NULL THEN ''
            WHEN length(d.url) < 15 THEN '***' 
            ELSE substring(d.url from 1 for 15) || '...'
        END as url_masked,
        d.created_at,
        d.updated_at
    FROM public.alert_webhook_destinations d
    ORDER BY d.created_at DESC;
END;
$$;

-- T13d: Assinatura de Webhooks HMAC SHA-256

BEGIN;

ALTER TABLE public.alert_webhook_destinations
ADD COLUMN IF NOT EXISTS signing_mode text default 'none', -- none | hmac_sha256
ADD COLUMN IF NOT EXISTS signing_secret text,
ADD COLUMN IF NOT EXISTS signing_header_name text default 'x-webhook-signature',
ADD COLUMN IF NOT EXISTS signing_timestamp_header_name text default 'x-webhook-timestamp',
ADD COLUMN IF NOT EXISTS signing_kid text;

-- Check opcional pra evitar insercoes com typo
ALTER TABLE public.alert_webhook_destinations
DROP CONSTRAINT IF EXISTS valid_signing_mode;

ALTER TABLE public.alert_webhook_destinations
ADD CONSTRAINT valid_signing_mode CHECK (signing_mode IN ('none', 'hmac_sha256'));

-- Seguranca: A rotina RPC q expoe list_alert_webhook_destinations NAO
-- deve expor o signing_secret nativamente no UI. O DB admin altera diretamente.

CREATE OR REPLACE FUNCTION public.list_alert_webhook_destinations()
RETURNS TABLE (
    id uuid,
    slug text,
    title text,
    description text,
    is_enabled boolean,
    webhook_url text,
    event_filter jsonb,
    signing_mode text,
    signing_header_name text,
    signing_timestamp_header_name text,
    signing_kid text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id, d.slug, d.title, d.description, d.is_enabled,
        d.webhook_url, d.event_filter,
        d.signing_mode, d.signing_header_name, d.signing_timestamp_header_name, d.signing_kid,
        d.created_at, d.updated_at
    FROM public.alert_webhook_destinations d
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

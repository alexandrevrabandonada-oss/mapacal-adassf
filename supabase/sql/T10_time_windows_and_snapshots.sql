-- T10_time_windows_and_snapshots.sql
-- Suporta filtros temporais consistentes em transparência, território e mapa
-- Adiciona parâmetro in_days às RPCs principais

-- ============================================================================
-- 1. Adaptar RPC get_transparency_summary para aceitar in_days
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_transparency_summary(
  in_days integer DEFAULT 30,
  in_neighborhood text DEFAULT NULL
)
RETURNS TABLE (
  total_published bigint,
  total_verified bigint,
  total_pending bigint,
  total_needs_review bigint,
  total_hidden bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'published' AND created_at >= NOW() - (in_days || ' days')::interval) as total_published,
    COUNT(*) FILTER (WHERE status = 'published' AND verified_count > 0 AND created_at >= NOW() - (in_days || ' days')::interval) as total_verified,
    COUNT(*) FILTER (WHERE status = 'pending' AND created_at >= NOW() - (in_days || ' days')::interval) as total_pending,
    COUNT(*) FILTER (WHERE status = 'published' AND needs_review = true AND created_at >= NOW() - (in_days || ' days')::interval) as total_needs_review,
    COUNT(*) FILTER (WHERE status = 'hidden' AND created_at >= NOW() - (in_days || ' days')::interval) as total_hidden
  FROM public.sidewalk_reports
  WHERE
    (in_neighborhood IS NULL OR neighborhood = in_neighborhood);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 2. Adaptar RPC get_condition_breakdown para aceitar in_days
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_condition_breakdown(
  in_days integer DEFAULT 30
)
RETURNS TABLE (
  condition text,
  count_published bigint,
  count_pending bigint,
  count_total bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.condition,
    COUNT(*) FILTER (WHERE sr.status = 'published' AND sr.created_at >= NOW() - (in_days || ' days')::interval) as count_published,
    COUNT(*) FILTER (WHERE sr.status = 'pending' AND sr.created_at >= NOW() - (in_days || ' days')::interval) as count_pending,
    COUNT(*) FILTER (WHERE sr.created_at >= NOW() - (in_days || ' days')::interval) as count_total
  FROM public.sidewalk_reports sr
  WHERE sr.created_at >= NOW() - (in_days || ' days')::interval
  GROUP BY sr.condition
  ORDER BY count_published DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 3. Adaptar RPC get_neighborhood_breakdown para aceitar in_days
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_neighborhood_breakdown(
  in_days integer DEFAULT 30
)
RETURNS TABLE (
  neighborhood text,
  count_published bigint,
  count_pending bigint,
  count_total bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.neighborhood,
    COUNT(*) FILTER (WHERE sr.status = 'published' AND sr.created_at >= NOW() - (in_days || ' days')::interval) as count_published,
    COUNT(*) FILTER (WHERE sr.status = 'pending' AND sr.created_at >= NOW() - (in_days || ' days')::interval) as count_pending,
    COUNT(*) FILTER (WHERE sr.created_at >= NOW() - (in_days || ' days')::interval) as count_total
  FROM public.sidewalk_reports sr
  WHERE sr.created_at >= NOW() - (in_days || ' days')::interval AND sr.neighborhood IS NOT NULL
  GROUP BY sr.neighborhood
  ORDER BY count_published DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 4. Adaptar RPC get_report_timeline para aceitar in_days
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_report_timeline(
  in_days integer DEFAULT 30
)
RETURNS TABLE (
  report_date text,
  count_created bigint,
  count_published bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(sr.created_at)::text as report_date,
    COUNT(*) as count_created,
    COUNT(*) FILTER (WHERE sr.status = 'published') as count_published
  FROM public.sidewalk_reports sr
  WHERE sr.created_at >= NOW() - (in_days || ' days')::interval
  GROUP BY DATE(sr.created_at)
  ORDER BY DATE(sr.created_at) ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 5. Adaptar RPC get_neighborhood_priority_breakdown para aceitar in_days
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_neighborhood_priority_breakdown(
  in_days integer DEFAULT 90
)
RETURNS TABLE (
  neighborhood text,
  total_published bigint,
  total_verified bigint,
  total_blocked bigint,
  total_bad bigint,
  total_good bigint,
  with_photo bigint,
  priority_score numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH neighborhood_stats AS (
    SELECT
      sr.neighborhood,
      COUNT(*) as total_published,
      COUNT(*) FILTER (WHERE v.id IS NOT NULL) as total_verified,
      COUNT(*) FILTER (WHERE sr.condition = 'blocked') as total_blocked,
      COUNT(*) FILTER (WHERE sr.condition = 'bad') as total_bad,
      COUNT(*) FILTER (WHERE sr.condition = 'good') as total_good,
      COUNT(*) FILTER (WHERE sr.photo_public_path IS NOT NULL) as with_photo
    FROM public.sidewalk_reports sr
    LEFT JOIN public.sidewalk_verifications v ON v.report_id = sr.id
    WHERE sr.status = 'published'
      AND sr.neighborhood IS NOT NULL
      AND sr.created_at >= NOW() - (in_days || ' days')::interval
    GROUP BY sr.neighborhood
  )
  SELECT
    ns.neighborhood,
    ns.total_published,
    ns.total_verified,
    ns.total_blocked,
    ns.total_bad,
    ns.total_good,
    ns.with_photo,
    (
      (ns.total_blocked * 3.0) +
      (ns.total_bad * 1.5) +
      (ns.total_verified * 0.5)
    ) / NULLIF(ns.total_published, 0) as priority_score
  FROM neighborhood_stats ns
  ORDER BY priority_score DESC, ns.total_published DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 6. Adaptar RPC get_neighborhood_recent_alerts para aceitar in_days
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_neighborhood_recent_alerts(
  in_limit integer DEFAULT 20,
  in_days integer DEFAULT 90
)
RETURNS TABLE (
  id text,
  created_at text,
  neighborhood text,
  condition text,
  verification_count bigint,
  is_verified boolean,
  has_photo boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.id,
    sr.created_at::text,
    sr.neighborhood,
    sr.condition,
    COUNT(v.id)::bigint as verification_count,
    COUNT(v.id) > 0 as is_verified,
    (sr.photo_public_path IS NOT NULL) as has_photo
  FROM public.sidewalk_reports sr
  LEFT JOIN public.sidewalk_verifications v ON v.report_id = sr.id
  WHERE sr.status = 'published'
    AND sr.neighborhood IS NOT NULL
    AND sr.created_at >= NOW() - (in_days || ' days')::interval
  GROUP BY sr.id, sr.created_at, sr.neighborhood, sr.condition, sr.photo_public_path
  ORDER BY sr.created_at DESC
  LIMIT in_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. Adaptar export RPC para aceitar in_days
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_export_published_reports(
  in_days integer DEFAULT 30,
  in_neighborhood text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  created_at text,
  condition text,
  neighborhood text,
  note text,
  lat numeric,
  lng numeric,
  verification_count bigint,
  is_verified boolean,
  has_photo boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.id,
    sr.created_at::text,
    sr.condition,
    sr.neighborhood,
    sr.note,
    sr.lat,
    sr.lng,
    COUNT(v.id)::bigint as verification_count,
    COUNT(v.id) > 0 as is_verified,
    (sr.photo_public_path IS NOT NULL) as has_photo
  FROM public.sidewalk_reports sr
  LEFT JOIN public.sidewalk_verifications v ON v.report_id = sr.id
  WHERE sr.status = 'published'
    AND sr.created_at >= NOW() - (in_days || ' days')::interval
    AND (in_neighborhood IS NULL OR sr.neighborhood = in_neighborhood)
  GROUP BY sr.id, sr.created_at, sr.condition, sr.neighborhood, sr.note, sr.lat, sr.lng, sr.photo_public_path
  ORDER BY sr.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 8. RPC para listar pontos do mapa com filtro temporal
-- ============================================================================
CREATE OR REPLACE FUNCTION public.list_published_reports_by_days(
  in_days integer DEFAULT 30
)
RETURNS TABLE (
  id text,
  created_at text,
  condition text,
  lat numeric,
  lng numeric,
  neighborhood text,
  note text,
  verification_count bigint,
  is_verified boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sr.id,
    sr.created_at::text,
    sr.condition,
    sr.lat,
    sr.lng,
    sr.neighborhood,
    sr.note,
    COUNT(v.id)::bigint as verification_count,
    COUNT(v.id) > 0 as is_verified
  FROM public.sidewalk_reports sr
  LEFT JOIN public.sidewalk_verifications v ON v.report_id = sr.id
  WHERE sr.status = 'published'
    AND sr.created_at >= NOW() - (in_days || ' days')::interval
  GROUP BY sr.id, sr.created_at, sr.condition, sr.lat, sr.lng, sr.neighborhood, sr.note
  ORDER BY sr.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 9. Annotations/documentação
-- ============================================================================
-- Todas as RPCs agora aceitam in_days como parâmetro
-- Valores recomendados: 7, 30, 90, 365 (definidos em lib/filters/time-window.ts)
-- Fallback seguro: 30 dias
-- 
-- Padrão de uso em TypeScript:
--   const { data } = await supabase.rpc("get_transparency_summary", {
--     in_days: 30,
--     in_neighborhood: null
--   });

COMMENT ON FUNCTION public.get_transparency_summary IS 'Retorna resumo de transparência filtrado por dias';
COMMENT ON FUNCTION public.get_condition_breakdown IS 'Retorna breakdown por condição filtrado por dias';
COMMENT ON FUNCTION public.get_neighborhood_breakdown IS 'Retorna breakdown por bairro filtrado por dias';
COMMENT ON FUNCTION public.get_report_timeline IS 'Retorna timeline de relatórios filtrado por dias';
COMMENT ON FUNCTION public.get_neighborhood_priority_breakdown IS 'Retorna ranking territorial com priority_score filtrado por dias';
COMMENT ON FUNCTION public.get_neighborhood_recent_alerts IS 'Retorna alertas recentes por bairro filtrado por dias';
COMMENT ON FUNCTION public.get_export_published_reports IS 'Retorna publicados para export filtrado por dias e bairro';
COMMENT ON FUNCTION public.list_published_reports_by_days IS 'Lista pontos do mapa filtrado por dias';
